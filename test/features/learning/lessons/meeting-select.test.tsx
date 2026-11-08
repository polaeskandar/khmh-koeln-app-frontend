import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { SessionProvider } from "@/features/identity/session"
import { apiUrl, problem } from "@test/support/api"
import {
  goodSamaritan,
  lessonDetail,
  lessonOptions,
  lessonStage,
  stageLessons,
} from "@test/support/fixtures/lessons"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import { toLink } from "@/features/learning/lessons/api"
import { EditLessonPage, NewLessonPage } from "@/features/learning/lessons/lesson-editor"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}))
afterEach(() => vi.restoreAllMocks())

const SCHEDULE_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f90"

function open(page: "new" | "edit", write?: () => Response) {
  search.value = page === "new" ? `stage=${lessonStage.id}` : `id=${goodSamaritan.id}`
  const sent: Record<string, unknown>[] = []

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(me.administrator)),
    http.get(apiUrl(`/stages/${lessonStage.id}/lessons`), () => HttpResponse.json(stageLessons())),
    http.get(apiUrl(`/stages/${lessonStage.id}/lesson-options`), () =>
      HttpResponse.json(lessonOptions())
    ),
    http.get(apiUrl(`/lessons/${goodSamaritan.id}`), () =>
      HttpResponse.json(lessonDetail({ scheduleId: SCHEDULE_ID, teachingDate: "2026-11-15" }))
    ),
    http.post(apiUrl(`/stages/${lessonStage.id}/lessons`), async ({ request }) => {
      sent.push((await request.json()) as Record<string, unknown>)

      return write?.() ?? HttpResponse.json({ id: "l2", status: "draft" }, { status: 201 })
    })
  )

  renderWithProviders(
    <SessionProvider>
      <SidebarProvider>{page === "new" ? <NewLessonPage /> : <EditLessonPage />}</SidebarProvider>
    </SessionProvider>
  )

  return sent
}

const option = (date: string) =>
  screen
    .getAllByRole("option")
    .find((o) => (o as HTMLOptionElement).value === `${SCHEDULE_ID}:${date}`) as HTMLOptionElement

describe("the meeting select", () => {
  test("a taken date reads its lesson and is disabled; new lessons default to the first free Sunday", async () => {
    open("new")
    const select = (await screen.findByLabelText("Meeting")) as HTMLSelectElement

    expect(option("2026-11-15").textContent).toBe(
      "Sun 15 Nov, 12:00 · Sunday class · has “⁨The Good Samaritan⁩”"
    )

    expect(option("2026-11-15").disabled).toBe(true)
    expect(option("2026-11-29").disabled).toBe(true)
    expect(select.value).toBe(`${SCHEDULE_ID}:2026-11-22`)

    expect(
      screen.getByText(/The session for this date is created on Sat 21 Nov\./)
    ).toBeInTheDocument()
  })

  test("editing The Good Samaritan keeps 15 Nov selected and enabled", async () => {
    open("edit")
    const select = (await screen.findByLabelText("Meeting")) as HTMLSelectElement
    expect(select.value).toBe(`${SCHEDULE_ID}:2026-11-15`)
    expect(option("2026-11-15").disabled).toBe(false)
    expect(screen.getByText(/created on Sat 14 Nov/)).toBeInTheDocument()
  })

  test("Mariam is preselected; 422s show under Responsible and When", async () => {
    open("new", () =>
      problem(422, "checkFields", {
        fieldErrors: {
          responsibleId: { code: "lessons.chooseResponsible", params: {} },
          meeting: { code: "lessons.meetingHasLesson", params: { title: "Zacchaeus" } },
        },
      })
    )

    expect(((await screen.findByLabelText("Responsible")) as HTMLSelectElement).value).toBe(
      me.administrator.account.id
    )

    await userEvent.type(screen.getByLabelText("Title"), "Zacchaeus")
    await userEvent.click(screen.getByRole("button", { name: "Save draft" }))

    await waitFor(() =>
      expect(screen.getByLabelText("Responsible")).toHaveAttribute("aria-invalid", "true")
    )

    expect(screen.getByLabelText("Meeting")).toHaveAttribute("aria-invalid", "true")

    expect(
      screen.getByText(/Zacchaeus/, { selector: "[data-slot='field-error']" })
    ).toBeInTheDocument()
  })
})

describe("toLink", () => {
  const options = lessonOptions().options

  test("a schedule date links its schedule and date", () => {
    expect(toLink(`${SCHEDULE_ID}:2026-11-22`, "2026-11-08", options)).toEqual({
      teachingDate: "2026-11-22",
      scheduleId: SCHEDULE_ID,
      sessionId: null,
    })
  })

  test("another date links only the date", () => {
    expect(toLink("other", "2026-12-24", options)).toEqual({
      teachingDate: "2026-12-24",
      scheduleId: null,
      sessionId: null,
    })
  })

  test("switching from a session's date to another schedule date sends no session", () => {
    expect(toLink(`${SCHEDULE_ID}:2026-11-08`, "2026-11-08", options).sessionId).toBeNull()
  })
})
