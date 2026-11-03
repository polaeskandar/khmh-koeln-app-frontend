import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Locale } from "@/i18n/config"
import { apiUrl } from "@test/support/api"
import { services } from "@test/support/fixtures/services"
import { stageRef } from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { ServiceRow } from "@/features/services/api"
import { ServiceDetails } from "@/features/services/service-details"
import { ServicesTable } from "@/features/services/services-overview"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-08T11:08:00Z") })
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const [sundaySchool, youth, , deacons] = services.items as ServiceRow[]

const leaders = [
  { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea101", name: "Mariam Fahmy" },
  { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea102", name: "Bishoy Tadros" },
]

const rows: ServiceRow[] = [
  {
    ...sundaySchool!,
    leaders,
    next: {
      date: "2026-11-08",
      startTime: "12:00",
      stage: stageRef("Kindergarten", 0),
      status: "scheduled",
    },
    trend: { sessions: 12, rate: 0.82, averagePresent: null },
  },
  {
    ...youth!,
    leaders: [],
    next: { date: "2026-11-13", startTime: "19:00", stage: null, status: "planned" },
    trend: { sessions: 4, rate: null, averagePresent: 9 },
  },
  { ...deacons!, next: null, trend: { sessions: 0, rate: null, averagePresent: null } },
]

function table(locale: Locale = "en", items = rows) {
  renderWithProviders(<ServicesTable rows={items} />, { locale })
}

const row = (name: string) =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .find((r) => within(r).queryByRole("link", { name }))!

test("attendance reads as a percent with a bar, an average, or no sessions", () => {
  table()
  const sunday = row("Sunday School")
  expect(sunday).toHaveTextContent("82%")
  expect(sunday.querySelector("[aria-hidden] > span")).toHaveStyle({ width: "82%" })
  expect(row("Youth Meeting")).toHaveTextContent("9 on average")
  expect(row("Deacons' School")).toHaveTextContent("No sessions")
})

test("German writes the percent with a space", () => {
  table("de")
  expect(row("Sunday School")).toHaveTextContent("82 %")
})

test("the next meeting reads the day and time with the stage or its status", () => {
  table()
  expect(row("Sunday School")).toHaveTextContent("Today, 12:00Kindergarten")
  expect(row("Youth Meeting")).toHaveTextContent(/Fri 13 Nov, 19:00\s*Planned/)
  expect(row("Deacons' School")).toHaveTextContent("Nothing planned")
})

test("archived services show a dash as next meeting", async () => {
  const choir = services.items.find((s) => s.archived)!
  renderWithProviders(<ServicesTable rows={[{ ...choir, next: null }]} />)
  await userEvent.click(screen.getByRole("tab", { name: "Archived (1)" }))
  const cells = within(row("Choir")).getAllByRole("cell")
  expect(cells.filter((cell) => cell.textContent === "—").length).toBeGreaterThanOrEqual(1)
  expect(row("Choir")).not.toHaveTextContent("Nothing planned")
})

test("phone cards add the next meeting", () => {
  table()
  const cards = within(screen.getByRole("list", { name: "Services" }))
  expect(cards.getByRole("link", { name: /Sunday School/ })).toHaveTextContent("next today, 12:00")
})

test("details show the attendance stat and no leaders", async () => {
  const service = rows[0]!
  search.value = `id=${service.id}`

  server.use(
    http.get(apiUrl(`/services/${service.id}`), () => HttpResponse.json(service)),
    http.get(apiUrl(`/services/${service.id}/stages`), () =>
      HttpResponse.json({ service, stages: [], archivedStages: [], can: { manageStructure: true } })
    ),
    http.get(apiUrl("/schedules"), () => HttpResponse.json({ today: "2026-11-08", items: [] }))
  )

  renderWithProviders(
    <SidebarProvider>
      <ServiceDetails />
    </SidebarProvider>
  )

  const stat = (await screen.findByText("Attendance, last 4 weeks")).parentElement!
  expect(stat).toHaveTextContent("82%")
  expect(screen.queryByRole("heading", { name: "Leaders" })).toBeNull()
})
