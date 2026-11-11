import { screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { SidebarNav } from "@/features/portals/staff/sidebar-nav"
import type { Me } from "@/features/identity/auth/api"
import { SessionProvider } from "@/features/identity/auth/session"
import type { Locale } from "@/i18n/config"
import type { AgendaItem, PlannedSession, SessionView } from "@/features/meetings/meetings/api"
import { apiUrl } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import {
  card,
  countsHandler,
  session,
  stageRef,
  sundaySchool,
} from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { AttendanceOverview } from "@/features/meetings/attendance/api"
import type { Upcoming } from "@/features/meetings/dashboard/api"
import { DashboardPage } from "@/features/meetings/dashboard/dashboard-page"
import { groupUpcoming } from "@/features/meetings/dashboard/group-upcoming"

const christine: Me = {
  ...me.servant,
  account: { ...me.servant.account, displayName: "Christine Adel" },
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-08T11:08:00Z") })
})

afterEach(() => {
  vi.useRealTimers()
})

const STAGES = ["Kindergarten", "1st Class", "2nd Class", "3rd Class", "4th Class", "5th Class"]

const planned = (
  date: string,
  stage: string,
  position: number,
  extra: Partial<PlannedSession> = {}
): PlannedSession => ({
  kind: "planned",
  scheduleId: `0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e9${String(position).padStart(3, "0")}`,
  date,
  title: "Sunday class",
  service: sundaySchool,
  stage: stageRef(stage, position),
  startTime: "12:00",
  endTime: "13:00",
  startsAt: `${date}T12:00:00+01:00`,
  endsAt: `${date}T13:00:00+01:00`,
  location: null,
  rosterMode: "expected",
  ...extra,
})

const demoDay = [
  ...STAGES.slice(0, 4).map((stage, i) => session({ stage: stageRef(stage, i), status: "active" })),
  session({ stage: stageRef("4th Class", 4), status: "scheduled" }),
  session({ stage: stageRef("5th Class", 5), status: "completed" }),
]

type DashboardData = { sessions: SessionView[]; upcoming: AgendaItem[] }

function open(
  data: DashboardData,
  { who = christine, locale = "en" }: { who?: Me; locale?: Locale } = {}
) {
  const overview: AttendanceOverview = {
    today: "2026-11-08",
    sessions: data.sessions.map((view) => card(view)),
    earlier: [],
    closed: [],
    openCount: 0,
  }

  const upcoming: Upcoming = {
    today: "2026-11-08",
    from: "2026-11-09",
    to: "2026-11-15",
    items: data.upcoming,
  }

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(who)),
    http.get(apiUrl("/dashboard/upcoming"), () => HttpResponse.json(upcoming)),
    http.get(apiUrl("/attendance/overview"), () => HttpResponse.json(overview)),
    countsHandler(data.sessions)
  )

  renderWithProviders(
    <SessionProvider>
      <SidebarNav />
      <DashboardPage />
    </SessionProvider>,
    { locale, sidebar: true }
  )
}

const data = (extra: Partial<DashboardData> = {}): DashboardData => ({
  sessions: demoDay,
  upcoming: [],
  ...extra,
})

test.each([
  ["2026-11-08T10:59:00Z", "Good morning, Christine"],
  ["2026-11-08T11:00:00Z", "Good afternoon, Christine"],
  ["2026-11-08T17:00:00Z", "Good evening, Christine"],
])("at %s it says %s", async (now, greeting) => {
  vi.setSystemTime(new Date(now))
  open(data())
  expect(await screen.findByRole("heading", { name: greeting, level: 1 })).toBeInTheDocument()
})

test("German greets in the afternoon with Guten Tag", async () => {
  open(data(), { locale: "de" })

  expect(
    await screen.findByRole("heading", { name: "Guten Tag, Christine", level: 1 })
  ).toBeInTheDocument()
})

test("today shows the six cards in API order and the summary", async () => {
  open(data())

  expect(
    await screen.findByText("4 meetings are taking attendance, 1 not opened yet.")
  ).toBeInTheDocument()

  const today = within((await screen.findByRole("heading", { name: "Today" })).closest("section")!)
  const cards = today.getAllByRole("article")
  expect(cards).toHaveLength(6)
  expect(cards[0]).toHaveTextContent("Kindergarten")
  expect(cards[5]).toHaveTextContent("5th Class")
})

test("Arabic joins the summary with the Arabic comma", async () => {
  open(data(), { locale: "ar" })
  expect(await screen.findByText(/، /)).toBeInTheDocument()
})

test("an empty day names tomorrow's groups", async () => {
  open(
    data({
      sessions: [],
      upcoming: [
        planned("2026-11-09", "3rd Class", 3),
        planned("2026-11-09", "4th Class", 4, { title: "Bible club" }),
      ],
    })
  )

  expect(await screen.findByText("Tomorrow: 3rd Class and 4th Class.")).toBeInTheDocument()
})

test("an empty week says to check Meetings", async () => {
  open(data({ sessions: [], upcoming: [] }))
  expect(await screen.findByText("Check Meetings for the coming days.")).toBeInTheDocument()
})

test("coming up has day headings and planned rows say when they are created", async () => {
  open(
    data({
      upcoming: [
        planned("2026-11-09", "3rd Class", 3),
        ...STAGES.map((stage, i) => planned("2026-11-15", stage, i)),
      ],
    })
  )

  expect(await screen.findByRole("heading", { name: "Tomorrow" })).toBeInTheDocument()
  const sunday = within(screen.getByRole("heading", { name: "Sun 15 Nov" }).closest("section")!)
  const row = sunday.getByRole("link", { name: /Sunday School · 6 stages/ })
  expect(row).toHaveAttribute("href", `/meetings/?date=2026-11-15&service=${sundaySchool.id}`)
  expect(row).toHaveTextContent("Created on Sat 14 Nov")
})

test("German day headings", async () => {
  open(
    data({
      upcoming: [planned("2026-11-09", "3rd Class", 3), planned("2026-11-15", "3rd Class", 3)],
    }),
    { locale: "de" }
  )

  expect(await screen.findByRole("heading", { name: "Morgen" })).toBeInTheDocument()
  expect(screen.getByRole("heading", { name: "So., 15. Nov." })).toBeInTheDocument()
})

test("a servant without a group is told to ask the church office instead of empty lists", async () => {
  open(data({ sessions: [], upcoming: [] }), { who: { ...christine, assignments: [] } })

  expect(await screen.findByText("You are not assigned to a group yet")).toBeInTheDocument()

  expect(screen.getByText(/^Ask the church office\./)).toBeInTheDocument()
  expect(screen.queryByRole("heading", { name: "Today" })).toBeNull()
  expect(screen.queryByText("Check Meetings for the coming days.")).toBeNull()
})

test("without attendance: read the dashboard has no Today section", async () => {
  open(data({ upcoming: [planned("2026-11-09", "3rd Class", 3)] }), { who: me.churchOffice })

  expect(await screen.findByRole("heading", { name: "Tomorrow" })).toBeInTheDocument()
  expect(screen.queryByRole("heading", { name: "Today" })).toBeNull()
  expect(screen.queryAllByRole("article")).toEqual([])
})

test("the home page marks Dashboard active", async () => {
  open(data())
  const links = await screen.findAllByRole("link", { name: "Dashboard" })
  expect(links.some((link) => link.getAttribute("data-active") === "true")).toBe(true)
})

describe("groupUpcoming", () => {
  const label = (items: AgendaItem[]) => groupUpcoming(items)

  test("six planned Sunday School classes at 12:00 become one row", () => {
    const entries = label(STAGES.map((stage, i) => planned("2026-11-15", stage, i)))
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ kind: "group", groups: STAGES, date: "2026-11-15" })
  })

  test("two become one row with both names", () => {
    const entries = label([
      planned("2026-11-15", "Kindergarten", 0),
      planned("2026-11-15", "1st Class", 1),
    ])

    expect(entries).toEqual([
      expect.objectContaining({ kind: "group", groups: ["Kindergarten", "1st Class"] }),
    ])
  })

  test("canceled sessions, other titles and other times stay apart", () => {
    const canceled: AgendaItem = {
      ...session({
        date: "2026-11-15",
        status: "canceled",
        title: "Sunday class",
        stage: stageRef("2nd Class", 2),
      }),
      kind: "session",
    }

    const entries = label([
      planned("2026-11-15", "Kindergarten", 0),
      planned("2026-11-15", "1st Class", 1, { title: "Bible club" }),
      planned("2026-11-15", "3rd Class", 3, { startTime: "10:00" }),
      canceled,
    ])

    expect(entries.map((entry) => entry.kind)).toEqual(["single", "single", "single", "single"])
  })
})
