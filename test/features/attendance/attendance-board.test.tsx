import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { openRosterBoard, thirdClassBoard } from "@test/support/fixtures/board"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { AttendanceBoard } from "@/features/attendance/api"
import { TakeAttendancePage } from "@/features/attendance/take-attendance-page"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}))

function open(board: AttendanceBoard | (() => Response), locale: Locale = "en") {
  const id = typeof board === "function" ? "0192f3a4-7b1c-7d2e-8f3a-000000000999" : board.session.id
  search.value = `session=${id}`

  server.use(
    http.get(apiUrl(`/sessions/${id}/attendance`), () =>
      typeof board === "function" ? board() : HttpResponse.json(board)
    )
  )

  renderWithProviders(
    <SidebarProvider>
      <TakeAttendancePage />
    </SidebarProvider>,
    { locale }
  )
}

const roster = async () => within(await screen.findByRole("region", { name: "Roster" }))

describe("the 8 Nov roster", () => {
  test("lists 14 rows in API order with tab counts and the counter", async () => {
    const board = thirdClassBoard()
    open(board)
    const rows = (await roster()).getAllByRole("listitem")
    expect(rows).toHaveLength(14)

    expect(
      rows.map((row) => row.textContent?.match(/^[A-Z]{2}(.+?)(Present|Kirollos)/)?.[1])
    ).toEqual(
      board.roster.map((row) =>
        row.person.displayName ? "Kiro Iskander" : `${row.person.firstName} ${row.person.lastName}`
      )
    )

    expect(screen.getByRole("tab", { name: "All (14)" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Not yet (7)" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Present (7)" })).toBeInTheDocument()
    const panel = within(screen.getByTestId("counter-panel"))

    expect(panel.getByText(/of 14 present/).textContent).toBe(
      "7 of 14 present · +1 not on the roster"
    )

    expect(panel.getByRole("img", { name: /7 of 14 present/ })).toBeInTheDocument()
  })

  test("marked rows show the Berlin time; unmarked ones offer PRESENT", async () => {
    open(thirdClassBoard())
    const rows = (await roster()).getAllByRole("listitem")
    expect(rows[0]).toHaveTextContent("Present · 12:10")

    expect(
      within(rows[1]).getByRole("button", { name: "Mark Ramy Fanous present" })
    ).toBeInTheDocument()
  })

  test("the tabs filter the roster", async () => {
    open(thirdClassBoard())
    await roster()
    await userEvent.click(screen.getByRole("tab", { name: "Not yet (7)" }))
    expect((await roster()).getAllByRole("listitem")).toHaveLength(7)
    await userEvent.click(screen.getByRole("tab", { name: "Present (7)" }))

    expect(
      (await roster())
        .getAllByRole("listitem")
        .every((row) => /Present ·/.test(row.textContent ?? ""))
    ).toBe(true)
  })

  test("'fan' leaves Anna and Ramy Fanous", async () => {
    open(thirdClassBoard())
    await roster()
    await userEvent.type(screen.getByRole("textbox", { name: "Find a person" }), "fan")

    expect(
      (await roster()).getAllByRole("listitem").map((row) => row.textContent?.includes("Fanous"))
    ).toEqual([true, true])
  })

  test("a marked visitor shows their placement", async () => {
    open(thirdClassBoard())

    const visitors = within(
      await screen.findByRole("region", { name: "Present, not on the roster" })
    )

    expect(visitors.getByRole("listitem")).toHaveTextContent("Theo Mansour")
    expect(visitors.getByRole("listitem")).toHaveTextContent("Youth Meeting")
  })
})

describe("other boards", () => {
  test("an open roster has no tabs or cells and counts N present", async () => {
    open(openRosterBoard())
    const present = within(await screen.findByRole("region", { name: "Present" }))
    expect(present.getAllByRole("listitem")).toHaveLength(2)
    expect(screen.queryByRole("tab")).toBeNull()
    expect(screen.queryByRole("region", { name: "Roster" })).toBeNull()
    const panel = within(screen.getByTestId("counter-panel"))
    expect(panel.getByText(/present/).textContent).toBe("2 present")
    expect(panel.queryByRole("img")).toBeNull()
  })

  test("view only: no PRESENT, undo or Close", async () => {
    const board = thirdClassBoard()
    board.session = { ...board.session, can: { manage: false, record: false, reopen: false } }
    open(board)
    await roster()
    expect(screen.queryByRole("button", { name: /^Mark .* present$/ })).toBeNull()
    expect(screen.queryByRole("button", { name: /^Undo/ })).toBeNull()
    expect(screen.queryByRole("button", { name: /^Close/ })).toBeNull()
    expect(screen.getByText(/only the servants of this group take it/)).toBeInTheDocument()
  })

  test("reads right to left in Arabic", async () => {
    open(thirdClassBoard(), "ar")
    expect(await screen.findByRole("tab", { name: /14/ })).toBeInTheDocument()
  })

  test("a 404 shows not found", async () => {
    open(() => problem(404, "notFound.session"))
    expect(await screen.findByText("This page doesn’t exist")).toBeInTheDocument()
  })
})
