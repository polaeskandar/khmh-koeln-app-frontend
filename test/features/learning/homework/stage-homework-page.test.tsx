import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, expect, test, vi } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { THIRD_CLASS_ID, thirdClass } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import { address, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import { expectToast } from "@test/support/toasts"

import type { HomeworkItem, HomeworkList } from "@/features/learning/homework/api"
import { StageHomeworkPage } from "@/features/learning/homework/stage-homework-page"

beforeEach(() => {
  address.set(`id=${THIRD_CLASS_ID}`)
})

const lesson = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e9001",
  title: "The Good Samaritan",
  teachingDate: "2026-11-01",
  archived: false,
}

const row = (
  id: string,
  title: string,
  status: HomeworkItem["status"],
  extra: Partial<HomeworkItem> = {}
): HomeworkItem => ({
  id,
  title,
  status,
  dueDate: "2026-11-08",
  publishedAt: status === "draft" ? null : "2026-11-01T10:00:00Z",
  lesson,
  counts:
    status === "draft"
      ? null
      : {
          assigned: 12,
          completed: 3,
          notCompleted: 9,
          completedAfterDueDate: 0,
          withoutParentAccount: 2,
          withoutAccount: 2,
          reportedTotal: 3,
        },
  ...extra,
})

const data = (items: HomeworkItem[], extra: Partial<HomeworkList> = {}): HomeworkList => ({
  today: "2026-11-01",
  stage: { id: THIRD_CLASS_ID, name: "Third class", position: 3 },
  archived: false,
  tabs: {
    published: items.filter((i) => i.status === "published").length,
    draft: items.filter((i) => i.status === "draft").length,
    archived: items.filter((i) => i.status === "archived").length,
  },
  lessons: [lesson],
  defaultLessonId: lesson.id,
  audienceSize: 12,
  items,
  ...extra,
})

const verse = row("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea001", "Learn the memory verse", "published")
const drawing = row("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea002", "Draw the inn", "draft")

const prayer = row("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea003", "Pray for a neighbour", "published", {
  counts: null,
})

function open(body: HomeworkList | (() => HomeworkList), account: Me = me.servant) {
  server.use(
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}`), () => HttpResponse.json(thirdClass)),
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}/homework`), () =>
      HttpResponse.json(typeof body === "function" ? body() : body)
    )
  )

  renderWithProviders(<StageHomeworkPage />, { me: account, sidebar: true })
}

const table = async () => within(await screen.findByRole("table"))

test("shows published homework first with what was reported", async () => {
  open(data([verse, drawing, prayer]))
  const rows = (await table()).getAllByRole("row").slice(1)
  expect(rows).toHaveLength(2)
  expect(screen.getByRole("tab", { name: "Published (2)", selected: true })).toBeInTheDocument()
  expect(screen.getByRole("tab", { name: "Drafts (1)" })).toBeInTheDocument()
  const link = within(rows[0]!).getByRole("link", { name: "Learn the memory verse" })
  expect(link).toHaveAttribute("href", `/homework/view/?id=${verse.id}`)
  expect(rows[0]).toHaveTextContent("The Good Samaritan · Today")
  expect(rows[0]).toHaveTextContent("2 people without an account")
  expect(rows[1]).toHaveTextContent("Hidden from parents and members")
})

test("opens on drafts when nothing is published yet, and drafts open the editor", async () => {
  open(data([drawing]))
  expect(await screen.findByRole("tab", { name: "Drafts (1)", selected: true })).toBeInTheDocument()
  const link = (await table()).getByRole("link", { name: "Draw the inn" })
  expect(link).toHaveAttribute("href", `/homework/edit/?id=${drawing.id}`)
})

test("keeps the tab in the address", async () => {
  address.set(`id=${THIRD_CLASS_ID}&status=archived`)
  open(data([verse]))

  expect(
    await screen.findByRole("tab", { name: "Archived (0)", selected: true })
  ).toBeInTheDocument()

  expect(screen.getByText("Nothing archived")).toBeInTheDocument()
  await userEvent.click(screen.getByRole("tab", { name: "Drafts (0)" }))
  expect(router.replace).toHaveBeenCalledWith(`/stages/homework/?id=${THIRD_CLASS_ID}&status=draft`)
})

test("offers new homework for the stage", async () => {
  open(data([verse]))

  expect(await screen.findByRole("link", { name: "New homework" })).toHaveAttribute(
    "href",
    `/homework/new/?stage=${THIRD_CLASS_ID}`
  )
})

test("asks for a lesson first when the stage has none", async () => {
  open(data([], { lessons: [], defaultLessonId: null }))
  const prepare = await screen.findByRole("link", { name: "Prepare a lesson" })
  expect(prepare).toHaveAttribute("href", `/lessons/new/?stage=${THIRD_CLASS_ID}`)
  expect(screen.queryByRole("link", { name: "New homework" })).not.toBeInTheDocument()
})

test("hides new homework from someone who cannot create it", async () => {
  open(data([verse]), me.churchOffice)
  await table()
  expect(screen.queryByRole("link", { name: "New homework" })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Prepare a lesson" })).not.toBeInTheDocument()
})

test("an archived stage offers no new homework", async () => {
  open(data([verse], { archived: true }))
  await table()
  expect(screen.queryByRole("link", { name: "New homework" })).not.toBeInTheDocument()
})

const publishToast = (title: string) =>
  `Published “${title}”. Parents and members of the class can see it now.`

test("publishes a draft row once, even on a double click, and it moves to Published", async () => {
  let current = data([drawing])
  const posts: unknown[] = []
  open(() => current)

  server.use(
    http.post(apiUrl(`/homework/${drawing.id}/publish`), async ({ request }) => {
      posts.push(await request.json())
      current = data([{ ...drawing, ...row(drawing.id, drawing.title, "published") }])

      return HttpResponse.json({
        id: drawing.id,
        status: "published",
        publishedAt: "2026-11-01T12:00:00Z",
        archivedAt: null,
        version: 2,
      })
    })
  )

  const draftRow = (await table()).getAllByRole("row")[1]!
  await userEvent.dblClick(within(draftRow).getByRole("button", { name: "Publish" }))
  await expectToast(publishToast("Draw the inn"))

  expect(
    await screen.findByRole("tab", { name: "Published (1)", selected: true })
  ).toBeInTheDocument()

  const published = (await table()).getAllByRole("row")[1]!
  expect(published).toHaveTextContent("3 of 12 reported done")
  expect(within(published).queryByRole("button", { name: "Publish" })).not.toBeInTheDocument()
  expect(posts).toEqual([{}])
})

test("the actions menu offers what the viewer may do with each row", async () => {
  address.set(`id=${THIRD_CLASS_ID}&status=published`)
  open(data([verse, drawing]))
  const rows = (await table()).getAllByRole("row").slice(1)

  await userEvent.click(
    within(rows[0]!).getByRole("button", { name: "Actions for Learn the memory verse" })
  )

  const menu = await screen.findByRole("menu")

  expect(
    within(menu)
      .getAllByRole("menuitem")
      .map((i) => i.textContent)
  ).toEqual(["Who reported it done", "Edit", "Archive"])

  expect(within(menu).getByRole("menuitem", { name: "Who reported it done" })).toHaveAttribute(
    "href",
    `/homework/view/?id=${verse.id}`
  )
})

test("someone who may neither change homework nor read members gets no actions", async () => {
  address.set(`id=${THIRD_CLASS_ID}&status=published`)
  open(data([verse]), me.attendanceOnly)
  const rows = (await table()).getAllByRole("row").slice(1)
  expect(within(rows[0]!).queryByRole("button")).not.toBeInTheDocument()
})

test("the draft menu offers Edit and Publish and works from the keyboard", async () => {
  open(data([drawing]))
  const draftRow = (await table()).getAllByRole("row")[1]!
  const trigger = within(draftRow).getByRole("button", { name: "Actions for Draw the inn" })
  trigger.focus()
  await userEvent.keyboard("{Enter}")
  const menu = await screen.findByRole("menu")
  const items = within(menu).getAllByRole("menuitem")
  expect(items.map((i) => i.textContent)).toEqual(["Edit", "Publish", "Archive", "Delete draft"])
  expect(items[0]).toHaveAttribute("href", `/homework/edit/?id=${drawing.id}`)
  await vi.waitFor(() => expect(items[0]).toHaveFocus())
  await userEvent.keyboard("{ArrowDown}")
  expect(items[1]).toHaveFocus()
})

test("a refused publish toasts and refetches the list", async () => {
  let reads = 0

  open(() => {
    reads++

    return data([drawing])
  })

  server.use(
    http.post(apiUrl(`/homework/${drawing.id}/publish`), () =>
      problem(409, "homework.lessonArchived")
    )
  )

  const draftRow = (await table()).getAllByRole("row")[1]!
  await userEvent.click(within(draftRow).getByRole("button", { name: "Actions for Draw the inn" }))
  await userEvent.click(await screen.findByRole("menuitem", { name: "Publish" }))

  await expectToast("The lesson is archived. Restore the lesson first.")

  await vi.waitFor(() => expect(reads).toBe(2))
})

test("counts people without any account, not only without parents", async () => {
  const members = row("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea005", "Write the letters", "published", {
    counts: {
      assigned: 9,
      completed: 1,
      notCompleted: 8,
      completedAfterDueDate: 0,
      withoutParentAccount: 9,
      withoutAccount: 6,
      reportedTotal: 1,
    },
  })

  open(data([members]))
  expect((await table()).getAllByRole("row")[1]).toHaveTextContent("6 people without an account")
})
