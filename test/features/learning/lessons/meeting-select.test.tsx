import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { describe, expect, test } from "vitest"

import { SessionProvider } from "@/features/identity/auth/session"
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
import { address } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import { toMeeting } from "@/features/learning/lessons/api"
import { EditLessonPage, NewLessonPage } from "@/features/learning/lessons/lesson-editor"

const SCHEDULE_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f90"

function open(page: "new" | "edit", write?: () => Response) {
  address.set(page === "new" ? `stage=${lessonStage.id}` : `id=${goodSamaritan.id}`)
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
    <SessionProvider>{page === "new" ? <NewLessonPage /> : <EditLessonPage />}</SessionProvider>,
    { sidebar: true }
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

describe("toMeeting", () => {
  const options = lessonOptions().options

  test("a schedule date sends its schedule and date", () => {
    expect(toMeeting(`${SCHEDULE_ID}:2026-11-22`, "2026-11-08", options)).toEqual({
      scheduleId: SCHEDULE_ID,
      date: "2026-11-22",
    })
  })

  test("another date sends only the date", () => {
    expect(toMeeting("other", "2026-12-24", options)).toEqual({ date: "2026-12-24" })
  })

  test("switching from a session's date to another schedule date sends no session", () => {
    expect(toMeeting(`${SCHEDULE_ID}:2026-11-08`, "2026-11-08", options)).not.toHaveProperty(
      "sessionId"
    )
  })
})
