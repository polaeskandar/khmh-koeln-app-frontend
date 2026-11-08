import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { apiUrl, problem } from "@test/support/api"
import { goodSamaritan, lessonDetail, lessonStage } from "@test/support/fixtures/lessons"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { LessonDetail } from "@/features/learning/lessons/api"
import { LessonPage } from "@/features/learning/lessons/lesson-page"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

const ID = goodSamaritan.id
const path = `/lessons/${ID}`

beforeEach(() => {
  search.value = `id=${ID}`
  router.push.mockClear()
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

afterEach(() => vi.restoreAllMocks())

function open(detail: LessonDetail | (() => LessonDetail)) {
  const current = typeof detail === "function" ? detail : () => detail
  let reads = 0

  server.use(
    http.get(apiUrl(path), () => {
      reads++

      return HttpResponse.json(current())
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <LessonPage />
    </SidebarProvider>
  )

  return { reads: () => reads }
}

async function menuItems() {
  await userEvent.click(await screen.findByRole("button", { name: "More actions" }))

  return within(await screen.findByRole("menu"))
    .getAllByRole("menuitem")
    .map((item) => item.textContent)
}

test("a draft that may be deleted offers Archive and Delete draft", async () => {
  open(lessonDetail({ status: "draft" }, { archive: true, delete: true }))
  expect(await menuItems()).toEqual(["Archive", "Delete draft"])
})

test("a ready lesson offers Back to draft and Archive", async () => {
  open(lessonDetail({ status: "ready" }, { archive: true }))
  expect(await menuItems()).toEqual(["Back to draft", "Archive"])
})

test("an archived lesson shows the badge and only Restore", async () => {
  open(lessonDetail({ archivedAt: "2026-11-01T10:00:00Z" }, { restore: true, archive: true }))
  expect(await screen.findByRole("button", { name: "Restore" })).toBeInTheDocument()
  expect(screen.getAllByText("Archived").length).toBeGreaterThan(0)
  expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "More actions" })).not.toBeInTheDocument()
})

test("false flags hide their items", async () => {
  open(lessonDetail({ status: "draft" }, { manage: false }))
  await screen.findByRole("heading", { name: goodSamaritan.title })
  expect(screen.queryByRole("button", { name: "More actions" })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument()
})

test("archiving lists the homework consequences, posts once and shows Archived", async () => {
  let archived = false
  const posts: unknown[] = []

  const base = () => ({
    ...lessonDetail(
      { status: "ready", archivedAt: archived ? "2026-11-08T12:00:00Z" : null },
      { archive: !archived, restore: archived }
    ),
    homework: { total: 3, published: 2, drafts: 1 },
  })

  open(base)

  server.use(
    http.post(apiUrl(`${path}/archive`), async ({ request }) => {
      posts.push(await request.json())
      archived = true

      return HttpResponse.json({ id: ID, archivedAt: "2026-11-08T12:00:00Z", homeworkArchived: 2 })
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
  expect(toast.success).toHaveBeenCalledWith("Archived “The Good Samaritan”.")
})

test("archiving without published homework lists no consequences", async () => {
  open(lessonDetail({ status: "ready" }, { archive: true }))
  await menuItems()
  await userEvent.click(screen.getByRole("menuitem", { name: "Archive" }))
  const dialog = await screen.findByRole("alertdialog")
  expect(dialog).not.toHaveTextContent("published homework")
  expect(dialog).not.toHaveTextContent("reported as done is kept")
})

test("a refused restore toasts the meeting's lesson", async () => {
  open(lessonDetail({ archivedAt: "2026-11-01T10:00:00Z" }, { restore: true }))

  server.use(
    http.post(apiUrl(`${path}/restore`), () =>
      problem(409, "lessons.meetingHasLesson", { params: { title: "Zacchaeus Meets Jesus" } })
    )
  )

  await userEvent.click(await screen.findByRole("button", { name: "Restore" }))

  await vi.waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "This meeting already has a lesson: “Zacchaeus Meets Jesus”. Edit that one, or pick another date."
    )
  )
})

test("deleting a draft toasts and opens the stage's lessons", async () => {
  let deletes = 0
  open(lessonDetail({ status: "draft" }, { archive: true, delete: true }))

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
  expect(toast.success).toHaveBeenCalledWith("Deleted “The Good Samaritan”.")
})

test("a refused delete toasts and keeps the dialog open", async () => {
  const page = open(lessonDetail({ status: "draft" }, { delete: true }))
  server.use(http.delete(apiUrl(path), () => problem(409, "lessons.homeworkPublished")))
  await menuItems()
  await userEvent.click(screen.getByRole("menuitem", { name: "Delete draft" }))
  const dialog = within(await screen.findByRole("alertdialog"))
  await userEvent.click(dialog.getByRole("button", { name: "Delete draft" }))

  await vi.waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "Homework of this lesson was published to parents. Archive the lesson instead."
    )
  )

  expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  expect(router.push).not.toHaveBeenCalled()
  await vi.waitFor(() => expect(page.reads()).toBe(2))
})
