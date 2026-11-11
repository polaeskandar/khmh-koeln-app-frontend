import { useQuery } from "@tanstack/react-query"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { describe, expect, test } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import { upcomingQuery } from "@/features/meetings/dashboard/api"
import { SessionPage } from "@/features/meetings/meetings/session-page"
import type { Locale } from "@/i18n/config"
import type { SessionView } from "@/features/meetings/meetings/api"
import { apiUrl, problem } from "@test/support/api"
import { boardOf, detailOf, thirdClassBoard } from "@test/support/fixtures/board"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { address, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import { expectToast } from "@test/support/toasts"
import type { AttendanceSheet } from "@/features/meetings/attendance/api"
import { TakeAttendancePage } from "@/features/meetings/attendance/take-attendance-page"

const viewer: Me = {
  ...me.servant,
  permissions: me.servant.permissions.filter(
    (p) => p.resource !== "attendance" || p.action === "read"
  ),
}

const scheduled = (overrides: Partial<SessionView> = {}): AttendanceSheet => {
  const board = thirdClassBoard()

  return {
    ...board,
    session: { ...board.session, status: "scheduled", ...overrides },
    roster: board.roster.map((row) => ({ ...row, mark: null })),
    notOnRoster: [],
  }
}

const opened = (board: AttendanceSheet) => ({
  ...detailOf(board).state,
  status: "active",
  openedAt: "2026-11-08T12:00:00+01:00",
})

function Upcoming() {
  useQuery(upcomingQuery)

  return null
}

function openBoard(
  board: AttendanceSheet,
  {
    open,
    locale = "en",
    who = me.servant,
  }: { open?: () => Response; locale?: Locale; who?: Me } = {}
) {
  address.set(`session=${board.session.id}`)
  let current = board
  const calls = { open: 0, get: 0, upcoming: 0 }

  server.use(
    http.get(apiUrl("/dashboard/upcoming"), () => {
      calls.upcoming++

      return HttpResponse.json({
        today: "2026-11-08",
        from: "2026-11-09",
        to: "2026-11-15",
        items: [],
      })
    }),
    http.get(apiUrl(`/sessions/${board.session.id}`), () => HttpResponse.json(detailOf(current))),
    http.get(apiUrl(`/sessions/${board.session.id}/attendance/corrections`), () =>
      HttpResponse.json({ items: [] })
    ),
    http.get(apiUrl(`/sessions/${board.session.id}/attendance`), () => {
      calls.get++

      return HttpResponse.json(boardOf(current))
    }),
    http.post(apiUrl(`/sessions/${board.session.id}/open`), () => {
      calls.open++
      const response = open?.() ?? HttpResponse.json(opened(board))

      if (response.ok) {
        current = { ...current, session: { ...current.session, status: "active" } }
      }

      return response
    })
  )

  renderWithProviders(
    <>
      <TakeAttendancePage />
      <Upcoming />
    </>,
    { locale, me: who, sidebar: true }
  )

  return calls
}

describe("the board route before and after", () => {
  test("a later date says when it opens, without a button", async () => {
    openBoard(scheduled({ date: "2026-11-15" }))

    expect(
      await screen.findByText(
        "It can be opened on Sunday 15 November 2026, the day of the session."
      )
    ).toBeInTheDocument()

    expect(screen.queryByRole("button", { name: "Open attendance" })).toBeNull()
  })

  test.each(["2026-11-08", "2026-11-01"])(
    "a session on %s opens with one request and shows the board in place",
    async (date) => {
      const calls = openBoard(scheduled({ date }))
      await userEvent.click(await screen.findByRole("button", { name: "Open attendance" }))
      expect(await screen.findByRole("region", { name: "Roster" })).toBeInTheDocument()
      expect(calls.open).toBe(1)
      expect(router.replace).not.toHaveBeenCalled()
    }
  )

  test("opening attendance refetches the dashboard's coming up list", async () => {
    const calls = openBoard(scheduled({ date: "2026-11-08" }))
    await userEvent.click(await screen.findByRole("button", { name: "Open attendance" }))
    await waitFor(() => expect(calls.upcoming).toBe(2))
  })

  test("without attendance: create the servants open it", async () => {
    openBoard(scheduled(), { who: viewer })

    expect(
      await screen.findByText("The servants of this group open it when the meeting starts.")
    ).toBeInTheDocument()

    expect(screen.queryByRole("button", { name: "Open attendance" })).toBeNull()
  })

  test("today's session isn't open yet and opens when the meeting starts", async () => {
    openBoard(scheduled())

    expect(
      await screen.findByRole("heading", { name: "Attendance isn’t open yet" })
    ).toBeInTheDocument()

    expect(
      screen.getByText("Open it when the meeting starts. You can mark people present right after.")
    ).toBeInTheDocument()
  })

  test("an earlier day's session says attendance wasn't taken and offers to open it now", async () => {
    openBoard(scheduled({ date: "2026-11-01" }))

    expect(
      await screen.findByRole("heading", { name: "Attendance wasn’t taken" })
    ).toBeInTheDocument()

    expect(screen.getByText("Open it now to record who came.")).toBeInTheDocument()
    expect(screen.queryByText(/isn’t open yet|when the meeting starts/)).toBeNull()
    expect(screen.getByRole("button", { name: "Open attendance" })).toBeInTheDocument()
  })

  test("without attendance: create an earlier day's session says the servants can still open it", async () => {
    openBoard(scheduled({ date: "2026-11-01" }), { who: viewer })

    expect(
      await screen.findByText("The servants of this group can still open it to record who came.")
    ).toBeInTheDocument()

    expect(screen.queryByRole("button", { name: "Open attendance" })).toBeNull()
  })

  test("a completed session replaces itself with the summary", async () => {
    const board = scheduled({ status: "completed" })
    openBoard(board)

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        `/attendance/summary/?session=${board.session.id}`
      )
    )
  })

  test("a cancel reason renders as text, isolated in Arabic", async () => {
    openBoard(scheduled({ status: "canceled", cancelReason: "<b>رحلة</b> retreat" }), {
      locale: "ar",
    })

    const reason = await screen.findByText("<b>رحلة</b> retreat")
    expect(reason).toHaveAttribute("dir", "auto")
    expect(reason.querySelector("b")).toBeNull()
  })

  test("a 409 opensOnTheDay says why in German and refetches", async () => {
    const calls = openBoard(scheduled(), {
      open: () => problem(409, "meetings.opensOnTheDay"),
      locale: "de",
    })

    await userEvent.click(await screen.findByRole("button", { name: "Anwesenheit öffnen" }))

    await expectToast("Die Anwesenheit kann erst am Tag des Termins geöffnet werden.")

    await waitFor(() => expect(calls.get).toBe(2))
  })
})

describe("the session page", () => {
  function openSession(view: Partial<SessionView>, who: Me = me.servant) {
    const board = scheduled(view)
    address.set(`id=${board.session.id}`)

    server.use(
      http.get(apiUrl(`/sessions/${board.session.id}`), () => HttpResponse.json(detailOf(board))),
      http.post(apiUrl(`/sessions/${board.session.id}/open`), () =>
        HttpResponse.json(opened(board))
      )
    )

    renderWithProviders(<SessionPage />, { me: who, sidebar: true })

    return board.session.id
  }

  test("a due session opens in one click and lands on the board", async () => {
    const id = openSession({})
    await userEvent.click(await screen.findByRole("button", { name: "Open attendance" }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(`/attendance/take/?session=${id}`))
  })

  test.each<[string, Partial<SessionView>, Me]>([
    ["a later session", { date: "2026-11-15" }, me.servant],
    ["no attendance: create", {}, viewer],
  ])("%s has no button", async (_, view, who) => {
    openSession(view, who)
    await screen.findByRole("heading", { level: 1 })
    expect(screen.queryByRole("button", { name: "Open attendance" })).toBeNull()
  })
})
