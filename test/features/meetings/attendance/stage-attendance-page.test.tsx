import { screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { beforeEach, expect, test } from "vitest"

import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { THIRD_CLASS_ID, thirdClass } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import { address } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { HistoryCell, AttendanceHistory } from "@/features/meetings/attendance/api"
import { StageAttendancePage } from "@/features/meetings/attendance/stage-attendance-page"

beforeEach(() => {
  address.set(`id=${THIRD_CLASS_ID}`)
})

const SUNDAYS = ["09-20", "09-27", "10-04", "10-11", "10-18", "10-25", "11-01", "11-08"]

const sessions = SUNDAYS.map((day, i) => ({
  id: `0192f3a4-7b1c-7d2e-8f3d-00000000000${i}`,
  date: `2026-${day}`,
  startsAt: `2026-${day}T12:00:00+02:00`,
  present: i === 7 ? 3 : 2,
}))

const P: HistoryCell = "present"
const N: HistoryCell = "notMarked"
const L: HistoryCell = "notOnRoster"

const person = (n: number, firstName: string, displayName: string | null = null) => ({
  id: `0192f3a4-7b1c-7d2e-8f3e-00000000000${n}`,
  firstName,
  lastName: "Hanna",
  displayName,
})

const history: AttendanceHistory = {
  today: "2026-11-08",
  sessions,
  rows: [
    { person: person(1, "Kirollos", "Kiro"), cells: [P, P, N, P, P, N, P, P], presentCount: 6 },
    { person: person(2, "Mina"), cells: [L, L, L, L, L, P, N, P], presentCount: 2 },
  ],
}

function open(answer: () => Response, locale: Locale = "en") {
  server.use(
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}`), () => HttpResponse.json(thirdClass)),
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}/attendance-history`), answer)
  )

  renderWithProviders(<StageAttendancePage />, { locale, sidebar: true })
}

test("is the current tab, ends the crumbs and links each session to its summary", async () => {
  open(() => HttpResponse.json(history))
  const table = await screen.findByRole("table")
  const tabs = within(screen.getByRole("navigation", { name: "3rd Class sections" }))
  expect(tabs.getByRole("link", { name: "Attendance" })).toHaveAttribute("aria-current", "page")

  expect(
    screen.getByText("Attendance", { selector: "[aria-current='page']:not(a)" })
  ).toBeInTheDocument()

  const headers = within(table).getAllByRole("columnheader")

  expect(within(headers[1]).getByRole("link")).toHaveAttribute(
    "href",
    `/attendance/summary/?session=${sessions[0].id}`
  )

  expect(headers[1]).toHaveTextContent("Sun20 Sep")
})

test("every cell has its mark, tooltip and screen-reader text; a later joiner starts with lines", async () => {
  open(() => HttpResponse.json(history))
  const table = await screen.findByRole("table")
  const [kiro, mina] = within(table).getAllByRole("row").slice(1, 3)
  const cells = (row: HTMLElement) => within(row).getAllByRole("cell").slice(0, 8)

  expect(cells(kiro).map((cell) => cell.textContent)).toEqual([
    "present",
    "present",
    "not marked",
    "present",
    "present",
    "not marked",
    "present",
    "present",
  ])

  expect(cells(kiro)[2].querySelector("[title]")).toHaveAttribute("title", "Not marked present")
  expect(cells(mina)[0].querySelector("[title]")).toHaveAttribute("title", "Not in the stage yet")
  expect(cells(mina)[0]).toHaveTextContent("not yet in stage")
  expect(within(kiro).getByRole("rowheader")).toHaveTextContent("Kiro Hanna")
})

test("n of 8 matches the filled cells; the footer counts visitors", async () => {
  open(() => HttpResponse.json(history))
  const table = await screen.findByRole("table")
  const rows = within(table).getAllByRole("row")
  expect(rows[1]).toHaveTextContent(/6 of 8$/)
  expect(rows[2]).toHaveTextContent(/2 of 8$/)

  expect(
    within(rows[3])
      .getAllByRole("cell")
      .map((cell) => cell.textContent)
  ).toEqual(["2", "2", "2", "2", "2", "2", "2", "3", ""])
})

test("says n of 3 with three sessions", async () => {
  open(() =>
    HttpResponse.json({
      ...history,
      sessions: sessions.slice(5),
      rows: [{ ...history.rows[0], cells: [N, P, P], presentCount: 2 }],
    })
  )

  expect(await screen.findByText("2 of 3")).toBeInTheDocument()
})

test("without closed sessions it says so", async () => {
  open(() => HttpResponse.json({ ...history, sessions: [], rows: [] }))
  expect(await screen.findByText("No closed sessions yet.")).toBeInTheDocument()
  expect(screen.queryByRole("table")).toBeNull()
})

test("a 403 keeps the header and tabs, without names", async () => {
  open(() => problem(403, "forbidden"))
  expect(await screen.findByText("Not allowed")).toBeInTheDocument()
  expect(screen.getByRole("heading", { level: 1, name: "3rd Class" })).toBeInTheDocument()
  expect(screen.queryByText("Kiro Hanna")).toBeNull()
})
