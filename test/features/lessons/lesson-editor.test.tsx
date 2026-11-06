import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { SessionProvider } from "@/features/auth/session"
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
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { LessonDetail } from "@/features/lessons/api"
import { EditLessonPage, NewLessonPage } from "@/features/lessons/lesson-editor"

const SCHEDULE_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f90"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
})

afterEach(() => {
  vi.restoreAllMocks()
  router.push.mockReset()
})

function render(page: React.ReactNode, write?: () => Response) {
  const sent: Record<string, unknown>[] = []

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(me.administrator)),
    http.get(apiUrl(`/stages/${lessonStage.id}/lessons`), () => HttpResponse.json(stageLessons())),
    http.get(apiUrl(`/stages/${lessonStage.id}/lesson-options`), () =>
      HttpResponse.json(lessonOptions())
    ),
    http.post(apiUrl(`/stages/${lessonStage.id}/lessons`), async ({ request }) => {
      sent.push((await request.json()) as Record<string, unknown>)

      return (
        write?.() ?? HttpResponse.json({ id: goodSamaritan.id, status: "ready" }, { status: 201 })
      )
    }),
    http.patch(apiUrl(`/lessons/${goodSamaritan.id}`), async ({ request }) => {
      sent.push((await request.json()) as Record<string, unknown>)

      return write?.() ?? HttpResponse.json({ id: goodSamaritan.id, status: "completed" })
    })
  )

  renderWithProviders(
    <SessionProvider>
      <SidebarProvider>{page}</SidebarProvider>
    </SessionProvider>
  )

  return sent
}

const openNew = (write?: () => Response) => {
  search.value = `stage=${lessonStage.id}`

  return render(<NewLessonPage />, write)
}

const openEdit = (detail: LessonDetail) => {
  search.value = `id=${detail.lesson.id}`
  server.use(http.get(apiUrl(`/lessons/${detail.lesson.id}`), () => HttpResponse.json(detail)))

  return render(<EditLessonPage />)
}

async function fillGoodSamaritan() {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText("Title"), "The Good Samaritan")
  await user.type(screen.getByLabelText("Biblical passage (optional)"), "Luke 10:25–37")
  await user.type(screen.getByLabelText("Material 1"), "Felt board figures")
  await user.click(screen.getByRole("button", { name: "Add material" }))
  await user.type(screen.getByLabelText("Material 2"), "Bandages")
  await user.type(screen.getByLabelText("Link for material 2"), "https://example.org/bandages")
  await user.click(screen.getByRole("button", { name: "Add material" }))

  return user
}

test("Mark ready posts ready, two materials, null for empty texts and no empty row", async () => {
  const sent = openNew()
  const user = await fillGoodSamaritan()
  await user.click(screen.getByRole("button", { name: "Mark ready" }))

  await waitFor(() =>
    expect(router.push).toHaveBeenCalledWith(`/lessons/view/?id=${goodSamaritan.id}`)
  )

  expect(sent[0]).toEqual({
    title: "The Good Samaritan",
    teachingDate: "2026-11-22",
    scheduleId: SCHEDULE_ID,
    sessionId: null,
    summary: null,
    passage: "Luke 10:25–37",
    memoryVerse: null,
    objectives: null,
    teachingPoints: null,
    activities: null,
    materials: [
      { label: "Felt board figures", url: null },
      { label: "Bandages", url: "https://example.org/bandages" },
    ],
    notes: null,
    responsibleId: me.administrator.account.id,
    status: "ready",
  })

  expect(toast.success).toHaveBeenCalledWith("Saved. The lesson is ready to teach.")
})

test("422s show in place, focus the first and keep the input", async () => {
  openNew(() =>
    problem(422, "checkFields", {
      fieldErrors: {
        title: { code: "lessons.titleRequired", params: {} },
        "materials.1.url": { code: "materials.url", params: {} },
        meeting: { code: "lessons.meetingHasLesson", params: { title: "Zacchaeus" } },
      },
    })
  )

  const user = await fillGoodSamaritan()
  await user.click(screen.getByRole("button", { name: "Save draft" }))
  await waitFor(() => expect(screen.getByLabelText("Title")).toHaveFocus())
  expect(screen.getByLabelText("Link for material 2")).toHaveAttribute("aria-invalid", "true")
  expect(screen.getByLabelText("Meeting")).toHaveAttribute("aria-invalid", "true")
  expect(screen.getByLabelText("Material 2")).toHaveValue("Bandages")
})

test.each([
  ["draft", ["Mark ready", "Save draft"]],
  ["ready", ["Save", "Save as draft"]],
  ["completed", ["Save changes"]],
] as const)("a %s lesson offers %s", async (status, buttons) => {
  openEdit(lessonDetail({ status }))
  await screen.findByLabelText("Title")

  for (const name of buttons) {
    expect(screen.getByRole("button", { name })).toBeInTheDocument()
  }

  expect(
    screen.queryAllByRole("button", {
      name: /^(Mark ready|Save draft|Save|Save as draft|Save changes)$/,
    })
  ).toHaveLength(buttons.length)
})

test("a completed lesson's Save changes sends no status and no unchanged link fields", async () => {
  const sent = openEdit(lessonDetail({ status: "completed" }))
  await userEvent.click(await screen.findByRole("button", { name: "Save changes" }))
  await waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]).not.toHaveProperty("status")
  expect(sent[0]).not.toHaveProperty("teachingDate")
  expect(sent[0]).not.toHaveProperty("responsibleId")
})

test("Add material is disabled at ten rows", async () => {
  openNew()
  const add = await screen.findByRole("button", { name: "Add material" })

  for (let i = 0; i < 9; i++) {
    await userEvent.click(add)
  }

  expect(add).toBeDisabled()
})

test("an archived lesson shows its notice instead of the form", async () => {
  openEdit(lessonDetail({ archivedAt: "2026-11-01T10:00:00+01:00" }))
  expect(await screen.findByText("This lesson is archived")).toBeInTheDocument()
  expect(screen.queryByLabelText("Title")).toBeNull()
})
