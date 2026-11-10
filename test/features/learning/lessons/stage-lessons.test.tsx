import { cleanup, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Me } from "@/features/identity/auth/api"
import { apiUrl } from "@test/support/api"
import { goodSamaritan, stageLessons } from "@test/support/fixtures/lessons"
import { me } from "@test/support/fixtures/me"
import { THIRD_CLASS_ID, thirdClass } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { LessonRow, StageLessons } from "@/features/learning/lessons/api"
import { StageLessonsPage } from "@/features/learning/lessons/stage-lessons"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  search.value = `id=${THIRD_CLASS_ID}`
  vi.spyOn(console, "error").mockImplementation(() => {})
})

const row = (overrides: Partial<LessonRow>): LessonRow => ({
  id: goodSamaritan.id,
  title: goodSamaritan.title,
  passage: goodSamaritan.passage,
  teachingDate: goodSamaritan.teachingDate,
  status: "ready",
  responsible: { id: "a1", name: "Daniel Mikhail" },
  collaborators: [],
  meeting: {
    kind: "planned",
    date: "2026-11-15",
    startTime: "12:00",
    title: "Sunday class",
    createdOn: "2026-11-14",
  },
  homework: { total: 0, published: 0, drafts: 0 },
  ...overrides,
})

const zacchaeus = row({
  id: "l-zac",
  title: "Zacchaeus Meets Jesus",
  passage: "Luke 19:1–10",
  teachingDate: "2026-11-08",
  status: "completed",
  meeting: {
    kind: "session",
    id: "s1",
    status: "active",
    date: "2026-11-08",
    startTime: "12:00",
    endTime: "13:00",
    title: "Sunday class",
    location: null,
    cancelReason: null,
  },
  homework: { total: 1, published: 0, drafts: 1 },
})

const builders = row({
  id: "l-builders",
  title: "The Wise and Foolish Builders",
  passage: "Matthew 7:24–27",
  teachingDate: "2026-11-22",
  status: "draft",
  responsible: null,
  meeting: {
    kind: "planned",
    date: "2026-11-22",
    startTime: "12:00",
    title: "Sunday class",
    createdOn: "2026-11-21",
  },
})

function open(list: StageLessons, account: Me = me.servant) {
  const queries: string[] = []

  server.use(
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}`), () => HttpResponse.json(thirdClass)),
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}/lessons`), ({ request }) => {
      queries.push(new URL(request.url).searchParams.get("q") ?? "")

      return HttpResponse.json(list)
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <StageLessonsPage />
    </SidebarProvider>,
    { me: account }
  )

  return queries
}

const upcoming = () =>
  stageLessons({
    tabs: { upcoming: 3, previous: 5, archived: 0 },
    items: [zacchaeus, row({}), builders],
    servants: [{ id: "a1", name: "Daniel Mikhail" }],
  })

const rows = async () =>
  within(
    (await screen.findByRole("heading", { name: "Lesson preparation" })).closest("section")!
  ).findAllByRole("listitem")

test("Upcoming lists the three lessons with their meeting lines and counts", async () => {
  open(upcoming())
  const items = await rows()
  expect(items).toHaveLength(3)
  expect(items[0]).toHaveTextContent("Today")
  expect(items[0]).toHaveTextContent("Zacchaeus Meets Jesus")
  expect(items[0]).toHaveTextContent("1 homework task · 1 draft")
  expect(items[1]).toHaveTextContent("The Good Samaritan")

  expect(within(items[1]).getByRole("link")).toHaveAttribute(
    "href",
    `/lessons/view/?id=${goodSamaritan.id}`
  )

  expect(screen.getByRole("tab", { name: "Upcoming (3)" })).toBeInTheDocument()
  expect(screen.getByRole("tab", { name: "Previous (5)" })).toBeInTheDocument()
  expect(screen.queryByRole("tab", { name: /Archived/ })).toBeNull()
})

test("search sends q; the status filter narrows; Clear filters resets", async () => {
  const queries = open(upcoming())
  await rows()
  await userEvent.type(screen.getByRole("textbox", { name: "Search lessons" }), "luke")
  await waitFor(() => expect(queries.at(-1)).toBe("luke"))
  expect(queries.filter((q) => q === "luke")).toHaveLength(1)
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Status" }), "Draft")

  expect((await rows()).map((item) => item.textContent)).toEqual([
    expect.stringContaining("The Wise and Foolish Builders"),
  ])

  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Servant" }), "Daniel Mikhail")
  await userEvent.click(await screen.findByRole("button", { name: "Clear filters" }))
  expect(screen.getByRole("textbox", { name: "Search lessons" })).toHaveValue("")
  expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue("")
  expect(screen.getByRole("combobox", { name: "Servant" })).toHaveValue("")
})

test("without lessons: create there is no New lesson and the note shows; a null responsible reads Former account", async () => {
  open(upcoming(), me.churchOffice)
  const items = await rows()
  expect(screen.queryByRole("link", { name: "New lesson" })).toBeNull()
  expect(screen.getByText(/Only the servants of this stage/)).toBeInTheDocument()
  expect(items[2]).toHaveTextContent("Former account")
})

test("New lesson opens the editor for this stage", async () => {
  open(upcoming())

  expect(await screen.findByRole("link", { name: "New lesson" })).toHaveAttribute(
    "href",
    `/lessons/new/?stage=${THIRD_CLASS_ID}`
  )
})

test("New lesson follows the servant's own stage, not the role alone", async () => {
  const servingIn = (stageId: string): Me => ({
    ...me.servant,
    assignments: [
      {
        service: thirdClass.service,
        stage: { id: stageId, name: "A class", position: 0, archived: false },
      },
    ],
  })

  open(upcoming(), servingIn(THIRD_CLASS_ID))
  expect(await screen.findByRole("link", { name: "New lesson" })).toBeInTheDocument()
  cleanup()
  open(upcoming(), servingIn("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f99"))
  await rows()
  expect(screen.queryByRole("link", { name: "New lesson" })).toBeNull()
})

test("an archived stage offers no New lesson", async () => {
  open({ ...upcoming(), archived: true })
  await rows()
  expect(screen.queryByRole("link", { name: "New lesson" })).toBeNull()
})
