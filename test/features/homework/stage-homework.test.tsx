import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { apiUrl } from "@test/support/api"
import { THIRD_CLASS_ID, thirdClass } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { HomeworkRow, StageHomework } from "@/features/homework/api"
import { StageHomeworkPage } from "@/features/homework/stage-homework"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  search.value = `id=${THIRD_CLASS_ID}`
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => vi.restoreAllMocks())

const lesson = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e9001",
  title: "The Good Samaritan",
  teachingDate: "2026-11-01",
}

const can = {
  edit: true,
  publish: true,
  unpublish: true,
  archive: true,
  restore: true,
  delete: true,
}

const row = (
  id: string,
  title: string,
  status: HomeworkRow["status"],
  extra: Partial<HomeworkRow> = {}
): HomeworkRow => ({
  id,
  title,
  status,
  dueDate: "2026-11-08",
  publishedAt: status === "draft" ? null : "2026-11-01T10:00:00Z",
  lesson,
  counts: status === "draft" ? null : { completed: 3, assigned: 12, withoutAccount: 2 },
  can,
  ...extra,
})

const data = (items: HomeworkRow[], extra: Partial<StageHomework> = {}): StageHomework => ({
  today: "2026-11-01",
  stage: { id: THIRD_CLASS_ID, name: "Third class", position: 3, archived: false },
  tabs: {
    published: items.filter((i) => i.status === "published").length,
    draft: items.filter((i) => i.status === "draft").length,
    archived: items.filter((i) => i.status === "archived").length,
  },
  lessons: [lesson],
  defaultLessonId: lesson.id,
  audienceSize: 12,
  can: { create: true },
  items,
  ...extra,
})

const verse = row("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea001", "Learn the memory verse", "published")
const drawing = row("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea002", "Draw the inn", "draft")

const prayer = row("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea003", "Pray for a neighbour", "published", {
  counts: null,
})

function open(body: StageHomework) {
  server.use(
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}`), () => HttpResponse.json(thirdClass)),
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}/homework`), () => HttpResponse.json(body))
  )

  renderWithProviders(
    <SidebarProvider>
      <StageHomeworkPage />
    </SidebarProvider>
  )
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
  search.value = `id=${THIRD_CLASS_ID}&status=archived`
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
  open(data([verse], { can: { create: false } }))
  await table()
  expect(screen.queryByRole("link", { name: "New homework" })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Prepare a lesson" })).not.toBeInTheDocument()
})
