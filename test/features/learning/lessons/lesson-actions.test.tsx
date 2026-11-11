import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, expect, test, vi } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import { apiUrl, problem } from "@test/support/api"
import { homeworkRow, stageHomework } from "@test/support/fixtures/homework"
import { goodSamaritan, lessonDetail, lessonStage } from "@test/support/fixtures/lessons"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { address, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import { expectToast } from "@test/support/toasts"

import type { HomeworkItem } from "@/features/learning/homework/api"
import type { LessonDetail } from "@/features/learning/lessons/api"
import { LessonPage } from "@/features/learning/lessons/lesson-page"

const ID = goodSamaritan.id
const path = `/lessons/${ID}`

beforeEach(() => {
  address.set(`id=${ID}`)
})

type Options = { account?: Me; tasks?: HomeworkItem[] }

function open(
  detail: LessonDetail | (() => LessonDetail),
  { account = me.servant, tasks = [] }: Options = {}
) {
  const current = typeof detail === "function" ? detail : () => detail
  let reads = 0

  server.use(
    http.get(apiUrl(path), () => {
      reads++

      return HttpResponse.json(current())
    }),
    http.get(apiUrl(`/stages/${lessonStage.id}/homework`), () =>
      HttpResponse.json(stageHomework({ items: tasks }))
    )
  )

  renderWithProviders(<LessonPage />, { me: account, sidebar: true })

  return { reads: () => reads }
}

async function menuItems() {
  await userEvent.click(await screen.findByRole("button", { name: "More actions" }))

  return within(await screen.findByRole("menu"))
    .getAllByRole("menuitem")
    .map((item) => item.textContent)
}

test("a draft without published homework offers Archive and Delete draft", async () => {
  open(lessonDetail({ status: "draft" }), { tasks: [homeworkRow()] })
  expect(await menuItems()).toEqual(["Archive", "Delete draft"])
})

test("a draft whose homework was ever published can't be deleted", async () => {
  const archived = homeworkRow({ status: "archived", publishedAt: "2026-11-01T10:00:00Z" })
  open(lessonDetail({ status: "draft" }), { tasks: [archived] })
  expect(await menuItems()).toEqual(["Archive"])
})

test("homework of another lesson doesn't keep a draft from being deleted", async () => {
  const other = homeworkRow({
    publishedAt: "2026-11-01T10:00:00Z",
    lesson: { id: "l-other", title: "Zacchaeus", teachingDate: "2026-11-01", archived: false },
  })

  open(lessonDetail({ status: "draft" }), { tasks: [other] })
  expect(await menuItems()).toEqual(["Archive", "Delete draft"])
})

test("a ready lesson offers Back to draft and Archive", async () => {
  open(lessonDetail({ status: "ready" }))
  expect(await menuItems()).toEqual(["Back to draft", "Archive"])
})

test("an archived lesson shows the badge and only Restore", async () => {
  open(lessonDetail({ archivedAt: "2026-11-01T10:00:00Z" }))
  expect(await screen.findByRole("button", { name: "Restore" })).toBeInTheDocument()
  expect(screen.getAllByText("Archived").length).toBeGreaterThan(0)
  expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "More actions" })).not.toBeInTheDocument()
})

test("without lessons: update there are no actions", async () => {
  open(lessonDetail({ status: "draft" }), { account: me.churchOffice })
  await screen.findByRole("heading", { name: goodSamaritan.title })
  expect(screen.queryByRole("button", { name: "More actions" })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument()
})

test("in an archived stage there are no actions, not even Restore", async () => {
  open(lessonDetail({ archivedAt: "2026-11-01T10:00:00Z" }, { archived: true }))
  await screen.findByRole("heading", { name: goodSamaritan.title })
  expect(screen.queryByRole("button", { name: "Restore" })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument()
})

test("archiving lists the homework consequences, posts once and shows Archived", async () => {
  let archived = false
  const posts: unknown[] = []

  const base = () =>
    lessonDetail(
      { status: "ready", archivedAt: archived ? "2026-11-08T12:00:00Z" : null },
      { homework: { total: 3, published: 2, drafts: 1 } }
    )

  open(base)

  server.use(
    http.post(apiUrl(`${path}/archive`), async ({ request }) => {
      posts.push(await request.json())
      archived = true

      return HttpResponse.json({
        id: ID,
        archivedAt: "2026-11-08T12:00:00Z",
        homeworkArchived: 2,
        version: 2,
      })
    })
  )

  await menuItems()
  await userEvent.click(screen.getByRole("menuitem", { name: "Archive" }))
  const dialog = within(await screen.findByRole("alertdialog"))
  expect(dialog.getByRole("heading")).toHaveTextContent(/^Archive “⁨The Good Samaritan⁩”\?$/)

  expect(
    dialog.getByText("Its 2 published homework tasks disappear for parents and members.")
  ).toBeInTheDocument()

  expect(dialog.getByText("What was already reported as done is kept.")).toBeInTheDocument()
  await userEvent.dblClick(dialog.getByRole("button", { name: "Archive" }))
  expect(await screen.findByRole("button", { name: "Restore" })).toBeInTheDocument()
  expect(posts).toEqual([{}])
  await expectToast("Archived “The Good Samaritan”.")
})

test("archiving without published homework lists no consequences", async () => {
  open(lessonDetail({ status: "ready" }))
  await menuItems()
  await userEvent.click(screen.getByRole("menuitem", { name: "Archive" }))
  const dialog = await screen.findByRole("alertdialog")
  expect(dialog).not.toHaveTextContent("published homework")
  expect(dialog).not.toHaveTextContent("reported as done is kept")
})

test("a refused restore toasts the meeting's lesson", async () => {
  open(lessonDetail({ archivedAt: "2026-11-01T10:00:00Z" }))

  server.use(
    http.post(apiUrl(`${path}/restore`), () =>
      problem(409, "lessons.meetingHasLesson", { params: { title: "Zacchaeus Meets Jesus" } })
    )
  )

  await userEvent.click(await screen.findByRole("button", { name: "Restore" }))

  await expectToast(
    "This meeting already has a lesson: “Zacchaeus Meets Jesus”. Edit that one, or pick another date."
  )
})

test("deleting a draft toasts and opens the stage's lessons", async () => {
  let deletes = 0
  open(lessonDetail({ status: "draft" }))

  server.use(
    http.delete(apiUrl(path), () => {
      deletes++

      return new HttpResponse(null, { status: 204 })
    })
  )

  await menuItems()
  await userEvent.click(screen.getByRole("menuitem", { name: "Delete draft" }))
  const dialog = within(await screen.findByRole("alertdialog"))
  await userEvent.click(dialog.getByRole("button", { name: "Delete draft" }))

  await vi.waitFor(() =>
    expect(router.push).toHaveBeenCalledWith(`/stages/lessons/?id=${lessonStage.id}`)
  )

  expect(deletes).toBe(1)
  await expectToast("Deleted “The Good Samaritan”.")
})

test("a refused delete toasts and keeps the dialog open", async () => {
  const page = open(lessonDetail({ status: "draft" }))
  server.use(http.delete(apiUrl(path), () => problem(409, "lessons.homeworkPublished")))
  await menuItems()
  await userEvent.click(screen.getByRole("menuitem", { name: "Delete draft" }))
  const dialog = within(await screen.findByRole("alertdialog"))
  await userEvent.click(dialog.getByRole("button", { name: "Delete draft" }))

  await expectToast("Homework of this lesson was published to parents. Archive the lesson instead.")

  expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  expect(router.push).not.toHaveBeenCalled()
  await vi.waitFor(() => expect(page.reads()).toBe(2))
})
