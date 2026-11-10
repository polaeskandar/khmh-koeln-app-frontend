import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { beforeEach, expect, test, vi } from "vitest"

import type { Me } from "@/features/identity/auth/api"
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
import { address, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { LessonDetail } from "@/features/learning/lessons/api"
import { EditLessonPage, NewLessonPage } from "@/features/learning/lessons/lesson-editor"

const SCHEDULE_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f90"

beforeEach(() => {
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

const versions: (string | null)[] = []

function render(page: React.ReactNode, write?: () => Response, account: Me = me.administrator) {
  const sent: Record<string, unknown>[] = []
  versions.length = 0

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(account)),
    http.get(apiUrl(`/stages/${lessonStage.id}/lessons`), () => HttpResponse.json(stageLessons())),
    http.get(apiUrl(`/stages/${lessonStage.id}/lesson-options`), () =>
      HttpResponse.json(lessonOptions())
    ),
    http.post(apiUrl(`/stages/${lessonStage.id}/lessons`), async ({ request }) => {
      sent.push((await request.json()) as Record<string, unknown>)

      return (
        write?.() ??
        HttpResponse.json({ id: goodSamaritan.id, status: "ready", version: 1 }, { status: 201 })
      )
    }),
    http.put(apiUrl(`/lessons/${goodSamaritan.id}`), async ({ request }) => {
      sent.push((await request.json()) as Record<string, unknown>)
      versions.push(new URL(request.url).searchParams.get("version"))

      return (
        write?.() ?? HttpResponse.json({ id: goodSamaritan.id, status: "completed", version: 2 })
      )
    })
  )

  renderWithProviders(<SessionProvider>{page}</SessionProvider>, { sidebar: true })

  return sent
}

const openNew = (write?: () => Response) => {
  address.set(`stage=${lessonStage.id}`)

  return render(<NewLessonPage />, write)
}

const openEdit = (detail: LessonDetail, write?: () => Response, account?: Me) => {
  address.set(`id=${detail.lesson.id}`)
  server.use(http.get(apiUrl(`/lessons/${detail.lesson.id}`), () => HttpResponse.json(detail)))

  return render(<EditLessonPage />, write, account)
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
    details: {
      title: "The Good Samaritan",
      summary: null,
      passage: "Luke 10:25–37",
      memoryVerse: null,
      collaboratorIds: [],
    },
    meeting: { scheduleId: SCHEDULE_ID, date: "2026-11-22" },
    plan: {
      objectives: null,
      teachingPoints: null,
      activities: null,
      notes: null,
      materials: [
        { label: "Felt board figures", url: null },
        { label: "Bandages", url: "https://example.org/bandages" },
      ],
    },
    responsibleId: me.administrator.account.id,
    status: "ready",
  })

  expect(toast.success).toHaveBeenCalledWith("Saved. The lesson is ready to teach.")
})

test("Enter in a field saves a new lesson as a draft", async () => {
  const sent = openNew()
  await userEvent.type(await screen.findByLabelText("Title"), "The Good Samaritan{Enter}")
  await waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]).toMatchObject({ details: { title: "The Good Samaritan" }, status: "draft" })
})

test("Enter in a ready lesson saves it and keeps it ready", async () => {
  const sent = openEdit(lessonDetail({ status: "ready" }))
  await userEvent.type(await screen.findByLabelText("Title"), "{Enter}")
  await waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]).toMatchObject({ status: "ready" })
})

test("422s show in place, focus the first and keep the input", async () => {
  openNew(() =>
    problem(422, "checkFields", {
      fieldErrors: {
        "details.title": { code: "lessons.titleRequired", params: {} },
        "plan.materials.1.url": { code: "materials.url", params: {} },
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

test("a material error lands on its row when an empty row comes first", async () => {
  openNew(() =>
    problem(422, "checkFields", {
      fieldErrors: { "plan.materials.0.url": { code: "materials.url", params: {} } },
    })
  )

  const user = userEvent.setup()
  await user.type(await screen.findByLabelText("Title"), "The Good Samaritan")
  await user.click(screen.getByRole("button", { name: "Add material" }))
  await user.type(screen.getByLabelText("Material 2"), "Bandages")
  await user.type(screen.getByLabelText("Link for material 2"), "not a link")
  await user.click(screen.getByRole("button", { name: "Save draft" }))

  await waitFor(() =>
    expect(screen.getByLabelText("Link for material 2")).toHaveAttribute("aria-invalid", "true")
  )

  expect(screen.getByLabelText("Link for material 1")).not.toHaveAttribute("aria-invalid")
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

test("a completed lesson's Save changes puts the whole lesson without a status, at its version", async () => {
  const sent = openEdit(
    lessonDetail({
      status: "completed",
      version: 4,
      summary: "Who is my neighbour?",
      objectives: "Love the neighbour",
      materials: [{ label: "Map of Judea", url: "https://example.org/map" }],
      notes: "Mina needs help reading.",
    })
  )

  await userEvent.click(await screen.findByRole("button", { name: "Save changes" }))
  await waitFor(() => expect(sent).toHaveLength(1))

  expect(sent[0]).toEqual({
    details: {
      title: "The Good Samaritan",
      summary: "Who is my neighbour?",
      passage: "Luke 10:25–37",
      memoryVerse: null,
      collaboratorIds: [],
    },
    meeting: { date: "2026-11-15" },
    plan: {
      objectives: "Love the neighbour",
      teachingPoints: null,
      activities: null,
      notes: "Mina needs help reading.",
      materials: [{ label: "Map of Judea", url: "https://example.org/map" }],
    },
    responsibleId: goodSamaritan.responsible!.id,
  })

  expect(versions).toEqual(["4"])
})

test("an editor who can't read members sends no notes and sees no notes field", async () => {
  const noMembers = {
    ...me.servant,
    permissions: me.servant.permissions.filter((p) => p.resource !== "members"),
  }

  const sent = openEdit(lessonDetail(), undefined, noMembers)
  await userEvent.click(await screen.findByRole("button", { name: "Save draft" }))
  await waitFor(() => expect(sent).toHaveLength(1))
  expect(screen.queryByLabelText(/Notes for the servants/)).toBeNull()
  expect(sent[0]!.plan).not.toHaveProperty("notes")
})

test("a 409 changedMeanwhile keeps the form", async () => {
  openEdit(lessonDetail(), () => problem(409, "lessons.changedMeanwhile"))
  await userEvent.click(await screen.findByRole("button", { name: "Save draft" }))
  await waitFor(() => expect(toast.error).toHaveBeenCalled())
  expect(router.push).not.toHaveBeenCalled()
  expect(screen.getByLabelText("Title")).toHaveValue("The Good Samaritan")
})

test("someone who can't create lessons sees no form", async () => {
  address.set(`stage=${lessonStage.id}`)
  render(<NewLessonPage />, undefined, me.churchOffice)
  expect(await screen.findByText("You can’t prepare lessons here")).toBeInTheDocument()
  expect(screen.queryByLabelText("Title")).toBeNull()
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
