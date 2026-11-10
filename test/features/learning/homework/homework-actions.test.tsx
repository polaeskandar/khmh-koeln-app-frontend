import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Me } from "@/features/identity/auth/api"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { THIRD_CLASS_ID, thirdClass } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import { address, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type {
  HomeworkCounts,
  HomeworkDetail,
  HomeworkProgress,
  HomeworkRow,
  StageHomework,
} from "@/features/learning/homework/api"
import { HomeworkProgressPage } from "@/features/learning/homework/homework-progress"
import { StageHomeworkPage } from "@/features/learning/homework/stage-homework"

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

const ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea001"
const stage = { id: THIRD_CLASS_ID, name: "3rd Class", position: 2 }

const lesson = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e9001",
  title: "The Good Samaritan",
  teachingDate: "2026-11-01",
  archived: false,
}

const counts = (reported: number): HomeworkCounts => ({
  assigned: 14,
  completed: reported,
  notCompleted: 14 - reported,
  completedAfterDueDate: 0,
  withoutParentAccount: 4,
  withoutAccount: 4,
  reportedTotal: reported,
})

const homework = (
  status: HomeworkRow["status"],
  extra: Partial<HomeworkRow> = {}
): HomeworkRow => ({
  id: ID,
  title: "Learn the memory verse",
  status,
  dueDate: "2026-11-08",
  publishedAt: status === "draft" ? null : "2026-11-01T10:00:00Z",
  lesson,
  counts: status === "draft" ? null : counts(0),
  ...extra,
})

const list = (item: HomeworkRow, archived = false): StageHomework => ({
  today: "2026-11-08",
  stage,
  archived,
  tabs: {
    published: item.status === "published" ? 1 : 0,
    draft: item.status === "draft" ? 1 : 0,
    archived: item.status === "archived" ? 1 : 0,
  },
  lessons: [lesson],
  defaultLessonId: lesson.id,
  audienceSize: 14,
  items: [item],
})

type Options = { account?: Me; archived?: boolean }

function openList(
  item: HomeworkRow | (() => HomeworkRow),
  { account = me.servant, archived = false }: Options = {}
) {
  const current = typeof item === "function" ? item : () => item
  address.set(`id=${THIRD_CLASS_ID}&status=${current().status}`)

  server.use(
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}`), () => HttpResponse.json(thirdClass)),
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}/homework`), () =>
      HttpResponse.json(list(current(), archived))
    )
  )

  renderWithProviders(
    <SidebarProvider>
      <StageHomeworkPage />
    </SidebarProvider>,
    { me: account }
  )
}

async function menuItems() {
  await userEvent.click(
    await screen.findByRole("button", { name: "Actions for Learn the memory verse" })
  )

  const items = within(await screen.findByRole("menu")).getAllByRole("menuitem")

  return items.map((item) => item.textContent)
}

const lifecycle = ["Back to draft", "Archive", "Restore", "Delete draft"]
const lifecycleItems = async () => (await menuItems()).filter((i) => lifecycle.includes(i!))

test("a never-published draft can be archived or deleted", async () => {
  openList(homework("draft"))
  expect(await menuItems()).toEqual(["Edit", "Publish", "Archive", "Delete draft"])
  expect(screen.getByRole("menu").querySelector("[data-slot$=separator]")).not.toBeNull()
})

test("published homework without reports can go back to draft or be archived", async () => {
  openList(homework("published"))
  expect(await menuItems()).toEqual(["Who reported it done", "Edit", "Back to draft", "Archive"])
})

test("published homework with reports can't go back to draft", async () => {
  openList(homework("published", { counts: counts(1) }))
  expect(await lifecycleItems()).toEqual(["Archive"])
})

test("archived homework can be restored, and deleted only if never published", async () => {
  openList(homework("archived"))
  expect(await lifecycleItems()).toEqual(["Restore"])
})

test("an archived draft can be restored or deleted", async () => {
  openList(homework("archived", { publishedAt: null }))
  expect(await lifecycleItems()).toEqual(["Restore", "Delete draft"])
})

test("homework of an archived lesson can't be edited, published or restored", async () => {
  const archivedLesson = { ...lesson, archived: true }
  openList(homework("draft", { lesson: archivedLesson }))
  expect(await menuItems()).toEqual(["Archive", "Delete draft"])
  expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument()
})

test("an archived task of an archived lesson can't be restored", async () => {
  openList(homework("archived", { lesson: { ...lesson, archived: true } }))
  expect(await menuItems()).toEqual(["Who reported it done"])
})

test("in an archived stage a draft has no actions", async () => {
  openList(homework("draft"), { archived: true })
  await screen.findByRole("link", { name: "Learn the memory verse" })
  expect(screen.queryByRole("button", { name: /Actions for/ })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument()
})

test("without homework: update only the progress is offered", async () => {
  openList(homework("published"), { account: me.churchOffice })
  expect(await menuItems()).toEqual(["Who reported it done"])
})

test("archiving says reported completions are kept, and posts {}", async () => {
  const reported = homework("published", { counts: counts(1) })

  const bodies: unknown[] = []
  openList(reported)

  server.use(
    http.post(apiUrl(`/homework/${ID}/archive`), async ({ request }) => {
      bodies.push(await request.json())

      return HttpResponse.json({
        id: ID,
        status: "archived",
        publishedAt: reported.publishedAt,
        archivedAt: "2026-11-08T12:00:00Z",
        version: 2,
      })
    })
  )

  await menuItems()
  await userEvent.click(screen.getByRole("menuitem", { name: "Archive" }))
  const dialog = await screen.findByRole("alertdialog")

  expect(within(dialog).getByRole("heading")).toHaveTextContent(
    /^Archive “⁨Learn the memory verse⁩”\?$/
  )

  expect(dialog).toHaveTextContent("The 1 reported completion is kept in the history.")
  await userEvent.click(within(dialog).getByRole("button", { name: "Archive" }))

  await vi.waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith(
      "Archived “Learn the memory verse”. Reported completions are kept."
    )
  )

  expect(bodies).toEqual([{}])
  await vi.waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
})

test("archiving without reports leaves the kept line out", async () => {
  openList(homework("published"))
  await menuItems()
  await userEvent.click(screen.getByRole("menuitem", { name: "Archive" }))
  expect(await screen.findByRole("alertdialog")).not.toHaveTextContent("kept in the history")
})

test("restoring says it comes back published only when it was published", async () => {
  openList(homework("archived"))
  await menuItems()
  await userEvent.click(screen.getByRole("menuitem", { name: "Restore" }))

  expect(await screen.findByRole("alertdialog")).toHaveTextContent(
    "It comes back published. Parents and members of the class will see it again."
  )
})

test("restoring a never-published task says it comes back as a draft", async () => {
  openList(homework("archived", { publishedAt: null }))
  await menuItems()
  await userEvent.click(screen.getByRole("menuitem", { name: "Restore" }))
  expect(await screen.findByRole("alertdialog")).toHaveTextContent(/It comes back as a draft\./)
})

test("a refused Back to draft toasts, keeps the dialog, and the refetched row drops it", async () => {
  let current = homework("published")
  openList(() => current)

  server.use(
    http.post(apiUrl(`/homework/${ID}/unpublish`), () => {
      current = homework("published", { counts: counts(1) })

      return problem(409, "homework.alreadyReported")
    })
  )

  await menuItems()
  await userEvent.click(screen.getByRole("menuitem", { name: "Back to draft" }))
  const dialog = await screen.findByRole("alertdialog")
  await userEvent.click(within(dialog).getByRole("button", { name: "Back to draft" }))

  await vi.waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "Parents have already reported it as completed. Archive it instead."
    )
  )

  expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }))
  await vi.waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())

  await vi.waitFor(async () => {
    await userEvent.keyboard("{Escape}")
    expect(await lifecycleItems()).toEqual(["Archive"])
  })
})

test("the menu and its dialog work with the keyboard", async () => {
  openList(homework("draft"))
  const trigger = await screen.findByRole("button", { name: "Actions for Learn the memory verse" })
  trigger.focus()
  await userEvent.keyboard("{Enter}")
  await screen.findByRole("menu")
  await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}")
  expect(screen.getByRole("menuitem", { name: "Delete draft" })).toHaveFocus()
  await userEvent.keyboard("{Enter}")
  const dialog = await screen.findByRole("alertdialog")
  expect(dialog).toHaveTextContent("The draft is removed for good.")
  await userEvent.keyboard("{Escape}")
  await vi.waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
})

test("deleting from the progress page opens the stage's homework list", async () => {
  const draft = homework("draft")

  const progress: HomeworkProgress = {
    today: "2026-11-08",
    service: thirdClass.service,
    stage,
    homework: { ...draft, instructions: "Say it.", resources: [] },
    lesson,
    counts: null,
    rows: [],
  }

  const detail: HomeworkDetail = {
    ...draft,
    today: "2026-11-08",
    instructions: "Say it.",
    resources: [],
    minDueDate: lesson.teachingDate,
    lesson: { ...lesson, passage: null, memoryVerse: null },
    service: thirdClass.service,
    stage,
    archived: false,
    audienceSize: 14,
    version: 1,
  }

  let deletes = 0
  address.set(`id=${ID}`)

  server.use(
    http.get(apiUrl(`/homework/${ID}/progress`), () => HttpResponse.json(progress)),
    http.get(apiUrl(`/homework/${ID}`), () => HttpResponse.json(detail)),
    http.delete(apiUrl(`/homework/${ID}`), () => {
      deletes++

      return new HttpResponse(null, { status: 204 })
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <HomeworkProgressPage />
    </SidebarProvider>,
    { me: me.servant }
  )

  expect(await menuItems()).toEqual(["Publish", "Archive", "Delete draft"])
  expect(screen.getAllByRole("button", { name: "Publish", hidden: true })).toHaveLength(1)
  await userEvent.click(screen.getByRole("menuitem", { name: "Delete draft" }))
  const dialog = await screen.findByRole("alertdialog")
  await userEvent.click(within(dialog).getByRole("button", { name: "Delete draft" }))

  await vi.waitFor(() =>
    expect(router.push).toHaveBeenCalledWith(`/stages/homework/?id=${THIRD_CLASS_ID}`)
  )

  expect(deletes).toBe(1)
  expect(toast.success).toHaveBeenCalledWith("Deleted “Learn the memory verse”.")
})

test("homework taken back to draft can be published again from the same row", async () => {
  let current = homework("draft")
  let publishes = 0
  openList(() => current)
  address.set(`id=${THIRD_CLASS_ID}`)

  server.use(
    http.post(apiUrl(`/homework/${ID}/publish`), () => {
      publishes++

      current = homework("published", { publishedAt: `2026-11-08T1${publishes}:00:00Z` })

      return HttpResponse.json({
        id: ID,
        status: "published",
        publishedAt: current.publishedAt,
        archivedAt: null,
        version: publishes * 2,
      })
    }),
    http.post(apiUrl(`/homework/${ID}/unpublish`), () => {
      current = homework("draft", { publishedAt: current.publishedAt })

      return HttpResponse.json({
        id: ID,
        status: "draft",
        publishedAt: current.publishedAt,
        archivedAt: null,
        version: publishes * 2 + 1,
      })
    })
  )

  await userEvent.click(await screen.findByRole("button", { name: "Publish" }))
  await screen.findByRole("tab", { name: "Published (1)", selected: true })
  await menuItems()
  await userEvent.click(screen.getByRole("menuitem", { name: "Back to draft" }))
  const dialog = await screen.findByRole("alertdialog")
  await userEvent.click(within(dialog).getByRole("button", { name: "Back to draft" }))
  await screen.findByRole("tab", { name: "Drafts (1)", selected: true })
  await userEvent.click(await screen.findByRole("button", { name: "Publish" }))
  await vi.waitFor(() => expect(publishes).toBe(2))
})
