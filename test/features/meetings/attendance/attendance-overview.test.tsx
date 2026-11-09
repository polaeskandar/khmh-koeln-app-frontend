import { screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { apiUrl, problem } from "@test/support/api"
import { session, stageRef, thirdClassRef } from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type {
  AttendanceOverview as Overview,
  OverviewSession,
} from "@/features/meetings/attendance/api"
import { AttendanceOverview } from "@/features/meetings/attendance/attendance-overview"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

afterEach(() => router.replace.mockReset())

const kindergarten = stageRef("Kindergarten", 0)
const firstClass = stageRef("1st Class", 1)

const today: OverviewSession[] = [
  session({
    stage: thirdClassRef,
    status: "active",
    counts: { present: 8, rosterSize: 14, rosterPresent: 7, notMarked: 7, notOnRoster: 1 },
  }),
  session({ stage: firstClass, status: "active" }),
  session({ stage: kindergarten, status: "scheduled", startTime: "14:00" }),
  session({ stage: null, status: "completed", startTime: "10:00" }),
  session({ stage: stageRef("2nd Class", 3), status: "canceled", cancelReason: "Retreat weekend" }),
  session({ stage: stageRef("4th Class", 4), status: "scheduled", startTime: "16:00" }),
]

function answer(overview: Partial<Overview> | (() => Response)) {
  server.use(
    http.get(apiUrl("/attendance/overview"), () =>
      typeof overview === "function"
        ? overview()
        : HttpResponse.json({
            today: "2026-11-08",
            sessions: today,
            earlier: [],
            closed: [],
            openCount: 2,
            ...overview,
          })
    )
  )

  return renderWithProviders(
    <SidebarProvider>
      <AttendanceOverview />
    </SidebarProvider>
  )
}

const cards = async () => {
  await screen.findByRole("heading", { level: 1, name: "Attendance" })

  return screen.getAllByRole("article")
}

test("a leader's six cards keep the API's order and offer the next step", async () => {
  answer({})
  const all = await cards()

  expect(all.map((card) => within(card).getByRole("heading", { level: 3 }).textContent)).toEqual([
    "3rd Class",
    "1st Class",
    "Kindergarten",
    "Sunday School",
    "2nd Class",
    "4th Class",
  ])

  const action = (card: HTMLElement) =>
    within(card)
      .queryAllByRole("link")
      .filter((link) => link.closest("h3") === null)

  expect(action(all[0]).map((link) => link.textContent)).toEqual(["Take attendance"])
  expect(action(all[0])[0]).toHaveAttribute("href", `/attendance/take/?session=${today[0].id}`)
  expect(action(all[1]).map((link) => link.textContent)).toEqual(["Take attendance"])
  expect(action(all[2]).map((link) => link.textContent)).toEqual(["Open attendance"])
  expect(action(all[3]).map((link) => link.textContent)).toEqual(["View attendance"])
  expect(action(all[3])[0]).toHaveAttribute("href", `/attendance/summary/?session=${today[3].id}`)
  expect(action(all[4])).toEqual([])
  expect(all[4]).toHaveTextContent(/Retreat weekend/)
})

test("with global roles a servant sees every session and each open one offers its action", async () => {
  answer({
    sessions: today.map((s) => ({ ...s, can: { manage: false, record: true, reopen: false } })),
  })

  const all = await cards()
  expect(all).toHaveLength(6)

  for (const card of all.filter((card) => !/Retreat weekend/.test(card.textContent ?? ""))) {
    expect(within(card).queryAllByRole("link").length).toBeGreaterThan(1)
  }

  expect(screen.queryByRole("button", { name: /Cancel|Move/ })).toBeNull()
})

test("earlier sessions are marked Not taken or Not closed and link to the board", async () => {
  const notTaken = session({ date: "2026-11-01", status: "scheduled" })
  const notClosed = session({ date: "2026-11-01", status: "active", stage: firstClass })
  answer({ earlier: [notTaken, notClosed] })

  const earlier = within(
    (await screen.findByRole("heading", { name: "Still open from earlier" })).closest("section")!
  )

  const rows = earlier.getAllByRole("link")
  expect(rows[0]).toHaveTextContent("Not taken")
  expect(rows[0]).toHaveAttribute("href", `/attendance/take/?session=${notTaken.id}`)
  expect(rows[1]).toHaveTextContent("Not closed")
})

test("without earlier sessions that section is hidden, and closed ones link to the summary", async () => {
  const closed = session({ status: "completed", closedAt: "2026-11-08T13:05:00+01:00" })
  answer({ closed: [closed] })
  await cards()
  expect(screen.queryByRole("heading", { name: "Still open from earlier" })).toBeNull()

  const recent = within(
    screen.getByRole("heading", { name: "Recently closed" }).closest("section")!
  )

  expect(recent.getByRole("link")).toHaveAttribute(
    "href",
    `/attendance/summary/?session=${closed.id}`
  )

  expect(recent.getByRole("link")).toHaveTextContent(/Closed today/)
})

test("an empty day links to Meetings, and nothing closed says so", async () => {
  answer({ sessions: [] })
  expect(await screen.findByText("No meetings to take attendance for today")).toBeInTheDocument()

  expect(screen.getByRole("link", { name: "See the coming days" })).toHaveAttribute(
    "href",
    "/meetings/"
  )

  expect(screen.getByText("Nothing closed yet.")).toBeInTheDocument()
})

test("a 403 shows the no-access state", async () => {
  answer(() => problem(403, "forbidden"))
  expect(await screen.findByText("Not allowed")).toBeInTheDocument()
})
