import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import type { Locale } from "@/i18n/config"
import { apiUrl } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { insightsOf, type ServiceInsightList, services } from "@test/support/fixtures/services"
import { stageRef } from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { address } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import {
  type ServiceRow,
  serviceInsightsQuery,
  type ServiceStages,
} from "@/features/organization/services/api"
import { ServiceDetailsPage } from "@/features/organization/services/service-details-page"
import { ServicesTable } from "@/features/organization/services/services-overview-page"

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-08T11:08:00Z") })
})

afterEach(() => {
  vi.useRealTimers()
})

const [sundaySchool, youth, , deacons] = services.items as ServiceRow[]

const kindergarten = stageRef("Kindergarten", 0)

const rows: ServiceRow[] = [sundaySchool!, youth!, deacons!]

const insights: ServiceInsightList = insightsOf(rows, {
  [sundaySchool!.id]: {
    next: {
      date: "2026-11-08",
      startTime: "12:00",
      stage: { id: kindergarten.id, name: kindergarten.name, position: kindergarten.position },
      status: "scheduled",
    },
    trend: { sessions: 12, rate: 0.82, averagePresent: null },
  },
  [youth!.id]: {
    next: { date: "2026-11-13", startTime: "19:00", stage: null, status: "planned" },
    trend: { sessions: 4, rate: null, averagePresent: 9 },
  },
})

async function table(locale: Locale = "en", items = rows, answer = insights) {
  server.use(http.get(apiUrl("/services/insights"), () => HttpResponse.json(answer)))

  const { client } = renderWithProviders(<ServicesTable rows={items} />, {
    locale,
    me: me.administrator,
  })

  await waitFor(() =>
    expect(client.getQueryState(serviceInsightsQuery.queryKey)?.status).toBe("success")
  )
}

const row = (name: string) =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .find((r) => within(r).queryByRole("link", { name }))!

test("attendance reads as a percent with a bar, an average, or no sessions", async () => {
  await table()
  const sunday = row("Sunday School")
  expect(sunday).toHaveTextContent("82%")
  expect(sunday.querySelector("[aria-hidden] > span")).toHaveStyle({ width: "82%" })
  expect(row("Youth Meeting")).toHaveTextContent("9 on average")
  expect(row("Deacons' School")).toHaveTextContent("No sessions")
})

test("German writes the percent with a space", async () => {
  await table("de")
  expect(row("Sunday School")).toHaveTextContent("82 %")
})

test("the next meeting reads the day and time with the stage or its status", async () => {
  await table()
  expect(row("Sunday School")).toHaveTextContent("Today, 12:00Kindergarten")
  expect(row("Youth Meeting")).toHaveTextContent(/Fri 13 Nov, 19:00\s*Planned/)
  expect(row("Deacons' School")).toHaveTextContent("Nothing planned")
})

test("archived services show a dash as next meeting", async () => {
  const choir = services.items.find((s) => s.archived)!
  await table("en", [choir], insightsOf([choir]))
  await userEvent.click(screen.getByRole("tab", { name: "Archived (1)" }))
  const cells = within(row("Choir")).getAllByRole("cell")
  expect(cells.filter((cell) => cell.textContent === "—").length).toBeGreaterThanOrEqual(1)
  expect(row("Choir")).not.toHaveTextContent("Nothing planned")
})

test("phone cards add the next meeting", async () => {
  await table()
  const cards = within(screen.getByRole("list", { name: "Services" }))
  expect(cards.getByRole("link", { name: /Sunday School/ })).toHaveTextContent("next today, 12:00")
})

test("details show the attendance stat and no leaders", async () => {
  const service = rows[0]!
  address.set(`id=${service.id}`)

  const stages: ServiceStages = {
    service: { id: service.id, name: service.name, tone: service.tone, archived: false },
    stages: [],
    archivedStages: [],
  }

  server.use(
    http.get(apiUrl(`/services/${service.id}`), () => HttpResponse.json(service)),
    http.get(apiUrl(`/services/${service.id}/stages`), () => HttpResponse.json(stages)),
    http.get(apiUrl(`/services/${service.id}/servants`), () =>
      HttpResponse.json({ servants: [], assignable: [] })
    ),
    http.get(apiUrl("/services"), () => HttpResponse.json(services)),
    http.get(apiUrl("/services/insights"), () => HttpResponse.json(insights)),
    http.get(apiUrl("/schedules"), () => HttpResponse.json({ today: "2026-11-08", items: [] }))
  )

  renderWithProviders(<ServiceDetailsPage />, { me: me.administrator, sidebar: true })

  const stat = (await screen.findByText("Attendance, last 4 weeks")).parentElement!
  await waitFor(() => expect(stat).toHaveTextContent("82%"))
  expect(screen.queryByRole("heading", { name: "Leaders" })).toBeNull()
})
