import { screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Me } from "@/features/identity/auth/api"
import type { HistoryEntry } from "@/lib/api/types/meetings"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { session, sessionDetail } from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { MeetingSession } from "@/features/meetings/meetings/api"
import { SessionPage } from "@/features/meetings/meetings/session-page"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}))

const schedule: MeetingSession["schedule"] = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f90",
  name: "Sunday class",
  recurrence: {
    frequency: "weekly",
    interval: 1,
    weekdays: [7],
    monthWeek: null,
    span: { startsOn: "2026-09-06", endsOn: null },
  },
  active: true,
}

function open(
  view: Parameters<typeof session>[0] = {},
  extra: Partial<MeetingSession> = {},
  who: Me = me.leader
) {
  const base = session(view)
  search.value = `id=${base.id}`
  let requests = 0

  server.use(
    http.get(apiUrl(`/sessions/${base.id}`), () => {
      requests++

      return HttpResponse.json(sessionDetail(base, { schedule, ...extra }))
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <SessionPage />
    </SidebarProvider>,
    { me: who }
  )

  return { id: base.id, requests: () => requests }
}

const header = async () =>
  within((await screen.findByRole("heading", { level: 1 })).closest("div")!.parentElement!)

const action = (name: string) => screen.queryByRole("link", { name })

describe("attendance by state", () => {
  test("a later scheduled session says when attendance can be taken, with no link", async () => {
    open({ status: "scheduled", date: "2026-11-15" })

    expect(
      await screen.findByText("Attendance can be taken on Sunday 15 November 2026.")
    ).toBeInTheDocument()

    expect(action("Open attendance")).toBeNull()
  })

  test("a due scheduled session offers to open attendance", async () => {
    open({ status: "scheduled" })
    expect(await screen.findByText("Attendance isn’t open yet.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open attendance" })).toBeInTheDocument()
  })

  test("an active session takes attendance", async () => {
    const { id } = open({ status: "active" })
    await header()
    expect(action("Take attendance")).toHaveAttribute("href", `/attendance/take/?session=${id}`)
  })

  test("a completed session links to the summary", async () => {
    const { id } = open({ status: "completed" })
    await header()
    expect(action("View attendance")).toHaveAttribute("href", `/attendance/summary/?session=${id}`)
  })

  test("without attendance: create there is no attendance link", async () => {
    open({ status: "active" }, {}, me.churchOffice)
    await header()
    expect(action("Take attendance")).toBeNull()
  })

  test("a completed session needs attendance: read for its summary link", async () => {
    open({ status: "completed" }, {}, me.churchOffice)
    await header()
    expect(action("View attendance")).toBeNull()
  })

  test.each([
    ["with a reason", "Retreat weekend", /This session was canceled\. Reason: .Retreat weekend./],
    ["without a reason", null, "This session was canceled. No reason was given."],
  ])("a canceled session %s", async (_, cancelReason, text) => {
    open({ status: "canceled", cancelReason })
    expect(await screen.findByRole("status")).toHaveTextContent(text)
    expect(screen.getByText("No attendance for a canceled session.")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /attendance/i })).toBeNull()
  })

  test("an Arabic reason stays isolated in English", async () => {
    open({ status: "canceled", cancelReason: "رحلة الخدام" })
    expect((await screen.findByRole("status")).textContent).toContain("Reason: ⁨رحلة الخدام⁩")
  })
})

describe("origin and history", () => {
  const at = (time: string) => `2026-11-0${time}`

  const history: HistoryEntry[] = [
    { type: "created", at: at("7T12:00:00+01:00"), actor: null, byGenerator: true, note: null },
    {
      type: "canceled",
      at: at("8T09:00:00+01:00"),
      actor: { id: "a1", name: "Bishoy Tadros" },
      byGenerator: false,
      note: "Retreat weekend",
    },
  ]

  test("a generated session names its schedule and lists its history oldest first", async () => {
    open({ status: "canceled", cancelReason: "Retreat weekend" }, { history })
    await screen.findByRole("heading", { name: "History" })

    expect(document.body).toHaveTextContent(
      "Created from the schedule Sunday class (Every Sunday)."
    )

    const timeline = within(screen.getByRole("heading", { name: "History" }).closest("section")!)
    const entries = timeline.getAllByRole("listitem")

    expect(entries.map((entry) => entry.textContent)).toEqual([
      expect.stringContaining("Created from the schedule, the day before"),
      expect.stringMatching(/Canceled.*Bishoy Tadros/),
    ])
  })

  test("a one-off session shows its badge and sentence", async () => {
    open({ scheduleId: null }, { schedule: null })

    expect(
      await screen.findByText("A one-off session, not part of a schedule.")
    ).toBeInTheDocument()

    expect(screen.getByText("One-off")).toBeInTheDocument()
  })
})

describe("not found", () => {
  test("a malformed id shows not found without a request", async () => {
    search.value = "id=not-a-uuid"

    renderWithProviders(
      <SidebarProvider>
        <SessionPage />
      </SidebarProvider>
    )

    expect(await screen.findByText("This page doesn’t exist")).toBeInTheDocument()
  })

  test("a 404 shows not found", async () => {
    const base = session()
    search.value = `id=${base.id}`
    server.use(http.get(apiUrl(`/sessions/${base.id}`), () => problem(404, "notFound.session")))

    renderWithProviders(
      <SidebarProvider>
        <SessionPage />
      </SidebarProvider>
    )

    expect(await screen.findByText("This page doesn’t exist")).toBeInTheDocument()
  })
})
