import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { apiUrl, problem } from "@test/support/api"
import type { Schemas } from "@/lib/api/client"
import { boardOf, detailOf, rosterPeople, thirdClassBoard } from "@test/support/fixtures/board"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { AttendanceSheet, Mark } from "@/features/meetings/attendance/api"
import { applyWrites, type Writes, writesReducer } from "@/features/meetings/attendance/mark-writes"
import { TakeAttendancePage } from "@/features/meetings/attendance/take-attendance-page"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "error")
})

afterEach(() => vi.restoreAllMocks())

const ramy = rosterPeople[1]

const savedMark: Mark = { id: "m-new", recordedAt: "2026-11-08T12:31:00+01:00" }

const markResponse = (mark: Mark, by = "Daniel Mikhail"): Schemas["MarkResponse"] => ({
  ...mark,
  sessionId: "0192f3a4-7b1c-7d2e-8f3a-000000000001",
  personId: ramy.id,
  recordedBy: { id: "a1", name: by },
})

describe("the write reducer", () => {
  const board = thirdClassBoard()
  const start = writesReducer({}, { type: "start", personId: ramy.id, present: true })

  test("pending shows a tick, confirmed shows the server's mark", () => {
    expect(applyWrites(board, start, 0).roster[1].mark).not.toBeNull()
    expect(applyWrites(board, start, 0).counts.rosterPresent).toBe(8)

    const confirmed = writesReducer(start, {
      type: "confirm",
      personId: ramy.id,
      mark: savedMark,
      at: 10,
    })

    expect(applyWrites(board, confirmed, 5).roster[1].mark).toEqual(savedMark)
  })

  test("a failure rolls back", () => {
    const failed = writesReducer(start, { type: "fail", personId: ramy.id })
    expect(failed).toEqual({})
    expect(applyWrites(board, failed, 0).roster[1].mark).toBeNull()
  })

  test("a refetch keeps a pending tick but drops an older confirmed one", () => {
    expect(applyWrites(board, start, Date.now()).roster[1].mark).not.toBeNull()

    const confirmed: Writes = writesReducer(start, {
      type: "confirm",
      personId: ramy.id,
      mark: savedMark,
      at: 10,
    })

    expect(applyWrites(board, confirmed, 20).roster[1].mark).toBeNull()
  })

  test("a failed undo after a confirmed mark goes back to the confirmed mark", () => {
    const confirmed = writesReducer(start, {
      type: "confirm",
      personId: ramy.id,
      mark: savedMark,
      at: 10,
    })

    const undoing = writesReducer(confirmed, { type: "start", personId: ramy.id, present: false })
    const failed = writesReducer(undoing, { type: "fail", personId: ramy.id })
    expect(failed).toEqual(confirmed)
    expect(applyWrites(board, failed, 5).roster[1].mark).toEqual(savedMark)
  })

  test("a pending row ignores a second tap", () => {
    expect(writesReducer(start, { type: "start", personId: ramy.id, present: false })).toBe(start)
  })
})

function open(
  write: () => Response | Promise<Response>,
  board: AttendanceSheet = thirdClassBoard()
) {
  search.value = `session=${board.session.id}`
  const calls = { put: 0, get: 0 }
  let current = board

  server.use(
    http.get(apiUrl(`/sessions/${board.session.id}`), () => HttpResponse.json(detailOf(board))),
    http.get(apiUrl(`/sessions/${board.session.id}/attendance/corrections`), () =>
      HttpResponse.json({ items: [] })
    ),
    http.get(apiUrl(`/sessions/${board.session.id}/attendance`), () => {
      calls.get++

      return HttpResponse.json(boardOf(current))
    }),
    http.put(apiUrl(`/sessions/${board.session.id}/attendance/${ramy.id}`), async () => {
      calls.put++
      const response = await write()

      if (response.ok) {
        const saved = (await response.clone().json()) as Schemas["MarkResponse"]
        const mark = { id: saved.id, recordedAt: saved.recordedAt }

        current = {
          ...current,
          roster: current.roster.map((row) => (row.person.id === ramy.id ? { ...row, mark } : row)),
        }
      }

      return response
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <TakeAttendancePage />
    </SidebarProvider>,
    { me: me.servant }
  )

  return calls
}

const markRamy = async () =>
  userEvent.click(await screen.findByRole("button", { name: "Mark Ramy Fanous present" }))

const ramyRow = () =>
  within(screen.getByRole("region", { name: "Roster" })).getAllByRole("listitem")[1]

const counter = () =>
  within(screen.getByTestId("counter-panel")).getByText(/of 14 present/).textContent

describe("marking on the board", () => {
  test("shows the tick and the count at once, and says it is saving until the write settles", async () => {
    let release = () => {}

    open(async () => {
      await new Promise<void>((resolve) => (release = resolve))

      return HttpResponse.json(markResponse(savedMark), { status: 201 })
    })

    await markRamy()
    expect(ramyRow()).toHaveTextContent("Present")
    expect(counter()).toMatch(/^8 of 14 present/)

    expect(within(screen.getByTestId("counter-panel")).getByRole("status")).toHaveTextContent(
      "Saving marks"
    )

    release()

    await waitFor(() =>
      expect(within(screen.getByTestId("counter-panel")).queryByRole("status")).toBeNull()
    )
  })

  test("503 then 201 confirms after two requests", async () => {
    let first = true

    const calls = open(() => {
      if (first) {
        first = false

        return problem(503, "unavailable")
      }

      return HttpResponse.json(markResponse(savedMark), { status: 201 })
    })

    await markRamy()
    await waitFor(() => expect(ramyRow()).toHaveTextContent("Present · 12:31"))
    expect(calls.put).toBe(2)
    expect(toast.error).not.toHaveBeenCalled()
  })

  test(
    "three network failures roll back, and Try again sends once more",
    { timeout: 10_000 },
    async () => {
      let failing = true

      const calls = open(() =>
        failing ? HttpResponse.error() : HttpResponse.json(markResponse(savedMark), { status: 201 })
      )

      await markRamy()
      await waitFor(() => expect(toast.error).toHaveBeenCalled(), { timeout: 5000 })
      expect(calls.put).toBe(3)

      expect(
        within(ramyRow()).getByRole("button", { name: "Mark Ramy Fanous present" })
      ).toBeInTheDocument()

      const [message, options] = vi.mocked(toast.error).mock.calls[0] as unknown as [
        string,
        { action: { onClick: () => void } },
      ]

      expect(message).toBe("Not saved. Check your connection and try again.")
      failing = false
      options.action.onClick()
      await waitFor(() => expect(calls.put).toBe(4))
      await waitFor(() => expect(ramyRow()).toHaveTextContent("Present · 12:31"))
    }
  )

  test("a 403 is never retried", async () => {
    const calls = open(() => problem(403, "forbidden"))
    await markRamy()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Your roles don’t allow this."))
    expect(calls.put).toBe(1)

    expect(
      within(ramyRow()).getByRole("button", { name: "Mark Ramy Fanous present" })
    ).toBeInTheDocument()
  })

  test("a 409 closedReopen rolls back, says why and refetches the board", async () => {
    const calls = open(() => problem(409, "attendance.closedReopen"))
    await markRamy()
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    await waitFor(() => expect(calls.get).toBe(2))

    expect(
      within(ramyRow()).getByRole("button", { name: "Mark Ramy Fanous present" })
    ).toBeInTheDocument()
  })

  test("another servant's earlier mark shows their time without an error", async () => {
    open(() =>
      HttpResponse.json(
        markResponse({ id: "m-old", recordedAt: "2026-11-08T12:05:00+01:00" }, "Bishoy Tadros"),
        { status: 200 }
      )
    )

    await markRamy()
    await waitFor(() => expect(ramyRow()).toHaveTextContent("Present · 12:05"))
    expect(toast.error).not.toHaveBeenCalled()
  })
})
