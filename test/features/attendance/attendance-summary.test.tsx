import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { apiUrl, problem } from "@test/support/api"
import { closedFirstNovember, openRosterBoard } from "@test/support/fixtures/board"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { AttendanceBoard } from "@/features/attendance/api"
import { AttendanceSummaryPage } from "@/features/attendance/attendance-summary"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}))

afterEach(() => {
  vi.restoreAllMocks()
  router.push.mockReset()
  router.replace.mockReset()
})

function open(board: AttendanceBoard, reopen?: (body: unknown) => Response) {
  search.value = `session=${board.session.id}`
  const sent: unknown[] = []

  server.use(
    http.get(apiUrl(`/sessions/${board.session.id}/attendance`), () => HttpResponse.json(board)),
    http.post(apiUrl(`/sessions/${board.session.id}/reopen`), async ({ request }) => {
      const body = await request.json()
      sent.push(body)

      return reopen?.(body) ?? HttpResponse.json({ id: board.session.id, status: "active" })
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <AttendanceSummaryPage />
    </SidebarProvider>
  )

  return sent
}

const section = async (name: RegExp | string) =>
  within((await screen.findByRole("heading", { name })).closest("section")!)

describe("the 1 Nov summary", () => {
  test("lists who was present with times, who wasn't marked and how it closed", async () => {
    open(closedFirstNovember())
    const present = await section("Present (11)")
    const rows = present.getAllByRole("listitem")
    expect(rows).toHaveLength(11)
    expect(rows[0]).toHaveTextContent("Anna Fanous12:10")
    expect((await section("Not marked present (3)")).getAllByRole("listitem")).toHaveLength(3)

    expect(screen.getByTestId("summary-line")).toHaveTextContent(
      "11 of 14 present · closed on Sun 1 Nov at 13:48 by Christine Adel"
    )
  })

  test("the correction and the history read as in mockup 08", async () => {
    open(closedFirstNovember())

    expect((await section("Corrections")).getByRole("listitem")).toHaveTextContent(
      /^Mina Hanna was marked at 12:04 and removed on Sun 1 Nov at 13:46 by Christine Adel: “.Tapped the wrong name.”$/
    )

    const history = (await section("History"))
      .getAllByRole("listitem")
      .map((item) => item.textContent)

    expect(history).toEqual([
      expect.stringContaining("Created"),
      expect.stringContaining("Attendance opened"),
      expect.stringContaining("Attendance closed"),
      expect.stringMatching(/Reopened for corrections.*Mina was not here/),
      expect.stringContaining("Attendance closed"),
    ])
  })

  test("Reopen sends the trimmed reason and opens the board", async () => {
    const board = closedFirstNovember()
    const sent = open(board)
    await userEvent.click(await screen.findByRole("button", { name: "Reopen for corrections" }))
    await userEvent.type(screen.getByRole("textbox"), "  Mina was there  ")
    await userEvent.click(screen.getByRole("button", { name: "Reopen" }))

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(`/attendance/take/?session=${board.session.id}`)
    )

    expect(sent).toEqual([{ reason: "Mina was there" }])
  })

  test("Reopen without a reason sends null; a 403 shows in the dialog", async () => {
    const sent = open(closedFirstNovember(), () => problem(403, "meetings.reopenLeadersOnly"))
    await userEvent.click(await screen.findByRole("button", { name: "Reopen for corrections" }))
    await userEvent.click(screen.getByRole("button", { name: "Reopen" }))
    expect(await within(screen.getByRole("alertdialog")).findByRole("alert")).toBeInTheDocument()
    expect(sent).toEqual([{ reason: null }])
    expect(router.push).not.toHaveBeenCalled()
  })

  test("Reopen shows only with can.reopen", async () => {
    const board = closedFirstNovember()
    board.session = { ...board.session, can: { ...board.session.can, reopen: false } }
    open(board)
    await section("Present (11)")
    expect(screen.queryByRole("button", { name: "Reopen for corrections" })).toBeNull()
  })
})

describe("other summaries", () => {
  test("an open roster has no Not marked section", async () => {
    const board = openRosterBoard()
    board.session = { ...board.session, status: "completed" }
    open(board)
    expect((await section("Present (2)")).getAllByRole("listitem")).toHaveLength(2)
    expect(screen.queryByRole("heading", { name: /Not marked present/ })).toBeNull()
  })

  test("a reopened session offers Continue and has no closed line", async () => {
    const board = closedFirstNovember()
    board.session = { ...board.session, status: "active", closedAt: null, closedBy: null }
    open(board)

    expect(await screen.findByRole("link", { name: "Continue taking attendance" })).toHaveAttribute(
      "href",
      `/attendance/take/?session=${board.session.id}`
    )

    expect(screen.getByTestId("summary-line")).not.toHaveTextContent("closed")
  })

  test("a null closer and remover drop the name", async () => {
    const board = closedFirstNovember()
    board.session = { ...board.session, closedBy: null }
    board.corrections = [{ ...board.corrections[0], removedBy: null, reason: null }]
    open(board)

    expect(await screen.findByTestId("summary-line")).toHaveTextContent(
      /closed on Sun 1 Nov at 13:48$/
    )

    expect((await section("Corrections")).getByRole("listitem")).toHaveTextContent(
      "Mina Hanna was marked at 12:04 and removed on Sun 1 Nov at 13:46."
    )
  })

  test("a scheduled session goes to the board", async () => {
    const board = closedFirstNovember()
    board.session = { ...board.session, status: "scheduled" }
    open(board)

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(`/attendance/take/?session=${board.session.id}`)
    )
  })
})
