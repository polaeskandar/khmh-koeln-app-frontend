import { screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { describe, expect, test, vi } from "vitest"

import type { AgendaItem, PlannedSession } from "@/features/meetings/meetings/api"
import { apiUrl } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { services } from "@test/support/fixtures/services"
import { session, stageRef, sundaySchool } from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { address } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import type { Agenda } from "@/features/meetings/meetings/api"
import { AgendaPage } from "@/features/meetings/meetings/agenda-page"

const asItem = (s: ReturnType<typeof session>): AgendaItem => ({ ...s, kind: "session" })

const planned = (date: string, stage = stageRef("4th Class", 4)): PlannedSession => ({
  kind: "planned",
  scheduleId: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f90",
  date,
  title: "Sunday class",
  service: sundaySchool,
  stage,
  startTime: "12:00",
  endTime: "13:00",
  startsAt: `${date}T12:00:00+01:00`,
  endsAt: `${date}T13:00:00+01:00`,
  location: null,
  rosterMode: "expected",
})

const window = (from: string, to: string, items: AgendaItem[] = []): Agenda => ({
  today: "2026-11-08",
  from,
  to,
  items,
})

function open(query: string, answer: (url: URL) => Agenda) {
  address.set(query)
  const requests: string[] = []

  server.use(
    http.get(apiUrl("/agenda"), ({ request }) => {
      const url = new URL(request.url)
      requests.push(url.search)

      return HttpResponse.json(answer(url))
    }),
    http.get(apiUrl("/services"), () => HttpResponse.json(services))
  )

  renderWithProviders(<AgendaPage />, { me: me.leader, sidebar: true })

  return requests
}

const defaultWindow = () => window("2026-11-02", "2026-11-15")
const strip = async () => within(await screen.findByRole("navigation", { name: "Days" }))
const selectedDay = async () => (await strip()).getByRole("link", { current: "date" })

describe("the selected day", () => {
  test("a day link sets ?date=, today removes it, and both keep the service", async () => {
    open(`service=${sundaySchool.id}`, defaultWindow)
    const days = await strip()

    expect(days.getByRole("link", { name: "Tue 10 Nov: no meetings" })).toHaveAttribute(
      "href",
      `/meetings/?date=2026-11-10&service=${sundaySchool.id}`
    )

    expect(days.getByRole("link", { name: "Sun 8 Nov: no meetings" })).toHaveAttribute(
      "href",
      `/meetings/?service=${sundaySchool.id}`
    )
  })

  test.each(["date=foo", "date=2026-12-01"])("%s selects today", async (query) => {
    open(query, defaultWindow)
    expect(await selectedDay()).toHaveAccessibleName("Sun 8 Nov: no meetings")
  })

  test("outside today's window the first day is selected", async () => {
    open("from=2026-10-19&date=2026-12-01", () => window("2026-10-19", "2026-11-01"))
    expect(await selectedDay()).toHaveAccessibleName("Mon 19 Oct: no meetings")
  })

  test("?from=foo asks for the default window", async () => {
    const requests = open("from=foo", defaultWindow)
    await strip()
    expect(requests).toEqual([""])
  })
})

describe("paging", () => {
  test("Earlier and Later shift the window and the date by 14 days", async () => {
    open("date=2026-11-10", defaultWindow)
    await strip()
    expect(screen.getByText("Monday 2 November to Sunday 15 November 2026")).toBeInTheDocument()

    expect(screen.getByRole("link", { name: "Earlier" })).toHaveAttribute(
      "href",
      "/meetings/?from=2026-10-19&date=2026-10-27"
    )

    expect(screen.getByRole("link", { name: "Later" })).toHaveAttribute(
      "href",
      "/meetings/?from=2026-11-16&date=2026-11-24"
    )
  })

  test("a paged window asks for 14 days and heads them", async () => {
    const requests = open("from=2026-10-19&date=2026-10-27", () =>
      window("2026-10-19", "2026-11-01")
    )

    expect(
      await screen.findByText("Monday 19 October to Sunday 1 November 2026")
    ).toBeInTheDocument()

    expect(requests).toEqual(["?from=2026-10-19&to=2026-11-01"])
    expect(await selectedDay()).toHaveAccessibleName("Tue 27 Oct: no meetings")

    expect(screen.getByRole("link", { name: "Later" })).toHaveAttribute(
      "href",
      "/meetings/?from=2026-11-02&date=2026-11-10"
    )
  })

  test("'Today' follows the response, not the device", async () => {
    vi.setSystemTime(new Date("2026-11-09T07:00:00Z"))
    open("", defaultWindow)

    expect((await strip()).getByRole("link", { name: "Sun 8 Nov: no meetings" })).toHaveTextContent(
      /^Today8$/
    )

    vi.useRealTimers()
  })
})

describe("a day's meetings", () => {
  const active = session({ status: "active", stage: stageRef("3rd Class", 2) })

  const canceled = session({
    status: "canceled",
    stage: stageRef("1st Class", 1),
    cancelReason: "Retreat",
  })

  const oneOff = session({ status: "scheduled", scheduleId: null, stage: null, startTime: "10:00" })

  const moved = session({
    status: "scheduled",
    stage: stageRef("Kindergarten", 0),
    startTime: "15:00",
  })

  const mixed = [
    asItem(active),
    asItem(canceled),
    asItem(oneOff),
    asItem(moved),
    planned("2026-11-08"),
  ]

  test("summarises the day and links each row", async () => {
    open("", () => window("2026-11-02", "2026-11-15", mixed))

    const day = within(
      (await screen.findByRole("heading", { name: "Sunday 8 November 2026" })).closest("section")!
    )

    expect(
      day.getByText(
        "5 meetings · 1 taking attendance · 1 canceled · 1 planned, created the day before"
      )
    ).toBeInTheDocument()

    const rows = day.getAllByRole("listitem")
    expect(rows[0]).toHaveTextContent("Sunday School")

    expect(within(rows[0]).getByRole("link")).toHaveAttribute(
      "href",
      `/meetings/sessions/view/?id=${oneOff.id}`
    )

    const link = (text: string) => rows.find((row) => row.textContent?.includes(text))!

    expect(within(link("3rd Class")).getByRole("link")).toHaveAttribute(
      "href",
      `/attendance/take/?session=${active.id}`
    )

    expect(within(link("1st Class")).getByRole("link")).toHaveAttribute(
      "href",
      `/meetings/sessions/view/?id=${canceled.id}`
    )

    expect(within(link("4th Class")).getByRole("link")).toHaveAttribute(
      "href",
      "/meetings/schedules/view/?id=0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f90"
    )
  })

  test.each([
    ["", "Pick another day above."],
    [`service=${sundaySchool.id}`, "Try all services, or pick another day."],
  ])("an empty day with %s says %s", async (query, text) => {
    open(query, defaultWindow)
    expect(await screen.findByText("No meetings on this day")).toBeInTheDocument()
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  test("six meetings with one canceled draw five squares", async () => {
    const six = [
      ...Array.from({ length: 5 }, (_, i) => asItem(session({ stage: stageRef(`Group ${i}`, i) }))),
      asItem(session({ status: "canceled", stage: stageRef("Group 5", 5) })),
    ]

    open("", () => window("2026-11-02", "2026-11-15", six))
    const day = (await strip()).getByRole("link", { name: "Sun 8 Nov: 6 meetings" })
    const squares = day.querySelector("[data-squares]")!
    expect(squares.querySelectorAll("span")).toHaveLength(5)
    expect(squares).not.toHaveTextContent("+")
  })

  test("seven open meetings draw five squares and a plus", async () => {
    const seven = Array.from({ length: 7 }, (_, i) =>
      asItem(session({ stage: stageRef(`Group ${i}`, i) }))
    )

    open("", () => window("2026-11-02", "2026-11-15", seven))
    const day = (await strip()).getByRole("link", { name: "Sun 8 Nov: 7 meetings" })
    const squares = day.querySelector("[data-squares]")!
    expect(squares.querySelectorAll("span")).toHaveLength(6)
    expect(squares).toHaveTextContent("+")
  })
})
