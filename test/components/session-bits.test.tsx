import { screen, within } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"

import type { ServiceRef, StageRef } from "@/lib/api/types/common"
import {
  type AgendaItem,
  compareAgenda,
  type HistoryEntry,
  type SessionItem,
} from "@/lib/api/types/meetings"
import { physicalClasses } from "@test/support/physical-classes"
import { renderWithProviders } from "@test/support/providers"

import { HistoryTimeline } from "@/components/history-timeline"
import { agendaHref, AgendaRow, SessionCardView } from "@/components/session-bits"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

afterEach(() => vi.unstubAllEnvs())

const TODAY = "2026-11-08"
const sundaySchool: ServiceRef = { id: "s1", name: "Sunday School", tone: 1, archived: false }
const youth: ServiceRef = { id: "s2", name: "Youth Meeting", tone: 2, archived: false }
const third: StageRef = { id: "st3", name: "3rd Class", position: 2, archived: false }
const first: StageRef = { id: "st1", name: "1st Class", position: 0, archived: false }

const session = (overrides: Partial<SessionItem> = {}): SessionItem => ({
  kind: "session",
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f99",
  scheduleId: "sch1",
  occurrenceDate: TODAY,
  title: "Sunday class",
  service: sundaySchool,
  stage: third,
  date: TODAY,
  startTime: "12:00",
  endTime: "13:15",
  startsAt: "2026-11-08T12:00:00+01:00",
  endsAt: "2026-11-08T13:15:00+01:00",
  location: "Room 4",
  status: "scheduled",
  rosterMode: "expected",
  cancelReason: null,
  counts: null,
  ...overrides,
})

const planned = (date: string): AgendaItem => ({
  kind: "planned",
  scheduleId: "sch1",
  date,
  title: "Sunday class",
  service: sundaySchool,
  stage: third,
  startTime: "12:00",
  endTime: "13:15",
  startsAt: `${date}T12:00:00+01:00`,
  endsAt: `${date}T13:15:00+01:00`,
  location: "Room 4",
  rosterMode: "expected",
})

describe("AgendaRow", () => {
  test("a planned date says when its session is created: the day before, never in the past", () => {
    renderWithProviders(
      <>
        <AgendaRow item={planned("2026-11-09")} today={TODAY} />
        <AgendaRow item={planned("2026-11-15")} today={TODAY} />
      </>
    )

    expect(screen.getByText("Created today")).toBeInTheDocument()
    expect(screen.getByText("Created on Sat 14 Nov")).toBeInTheDocument()
  })

  test("a canceled row is struck through, with its reason in its own direction", () => {
    renderWithProviders(
      <AgendaRow
        item={session({ status: "canceled", cancelReason: "زيارة الأسقف" })}
        today={TODAY}
      />
    )

    expect(screen.getByText("3rd Class")).toHaveClass("line-through")
    expect(screen.getByText("زيارة الأسقف")).toHaveAttribute("dir", "auto")
  })

  test("no count line without counts; with counts, the present line", () => {
    const { unmount } = renderWithProviders(
      <AgendaRow item={session({ status: "completed" })} today={TODAY} />
    )

    expect(screen.queryByText(/present/)).toBeNull()
    unmount()

    renderWithProviders(
      <AgendaRow
        item={session({
          status: "completed",
          counts: { present: 10, rosterSize: 14, rosterPresent: 9, notMarked: 5, notOnRoster: 1 },
        })}
        today={TODAY}
      />
    )

    expect(screen.getByText("9 of 14 present · +1 not on roster")).toBeInTheDocument()
  })
})

describe("agendaHref", () => {
  const id = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f99"

  test.each([
    ["active", `/attendance/take/?session=${id}`],
    ["completed", `/attendance/summary/?session=${id}`],
    ["scheduled", `/meetings/sessions/view/?id=${id}`],
    ["canceled", `/meetings/sessions/view/?id=${id}`],
  ] as const)("%s → %s", (status, href) => {
    expect(agendaHref(session({ status }))).toBe(href)
  })

  test("a planned date opens its schedule", () => {
    const item = planned("2026-11-15")
    expect(agendaHref(item)).toBe(`/meetings/schedules/view/?id=${item.scheduleId}`)
  })
})

describe("compareAgenda", () => {
  test("orders by date and time, then service name, then service-wide before the stages by position", () => {
    const items = [
      session({ id: "d", service: sundaySchool, stage: third }),
      session({ id: "e", date: "2026-11-07", service: youth, stage: null }),
      session({ id: "b", service: sundaySchool, stage: first }),
      session({ id: "f", service: youth, stage: null }),
      session({ id: "a", service: sundaySchool, stage: null }),
      session({ id: "g", startTime: "11:00", service: youth, stage: null }),
    ]

    expect([...items].sort(compareAgenda).map((s) => s.id)).toEqual(["e", "g", "a", "b", "d", "f"])
  })
})

describe("HistoryTimeline", () => {
  const entries: HistoryEntry[] = [
    {
      type: "created",
      at: "2026-11-07T03:00:00+01:00",
      actor: null,
      byGenerator: true,
      note: null,
    },
    {
      type: "canceled",
      at: "2026-11-08T10:00:00+01:00",
      actor: null,
      byGenerator: false,
      note: "Bishop's visit",
    },
  ]

  test.each(["UTC", "America/Los_Angeles"])("reads the same with the device in %s", (zone) => {
    vi.stubEnv("TZ", zone)
    renderWithProviders(<HistoryTimeline entries={entries} today={TODAY} />)
    const [created, canceled] = screen.getAllByRole("listitem")
    expect(created).toHaveTextContent("Created from the schedule, the day before")
    expect(within(created).queryByText(/·/)).toBeNull()
    expect(canceled).toHaveTextContent("Former account")
    expect(within(canceled).getByText("Bishop's visit")).toHaveAttribute("dir", "auto")
  })

  test("a one-off session was created by hand", () => {
    renderWithProviders(
      <HistoryTimeline
        oneOff
        today={TODAY}
        entries={[
          {
            type: "created",
            at: "2026-11-07T10:00:00+01:00",
            actor: { id: "a1", name: "Mina" },
            byGenerator: false,
            note: null,
          },
        ]}
      />
    )

    expect(screen.getByText("Created by hand as a one-off session")).toBeInTheDocument()
  })
})

test("in Arabic nothing uses a physical side", () => {
  const { container } = renderWithProviders(
    <>
      <AgendaRow item={session({ status: "canceled", cancelReason: "سبب" })} today={TODAY} />
      <AgendaRow item={planned("2026-11-15")} today={TODAY} compact />
      <SessionCardView
        session={session({
          status: "active",
          counts: { present: 9, rosterSize: 14, rosterPresent: 9, notMarked: 5, notOnRoster: 0 },
        })}
        today={TODAY}
      />
    </>,
    { locale: "ar" }
  )

  const classes = [...container.querySelectorAll("[class]")].map(
    (el) => `"${el.getAttribute("class")}"`
  )

  expect(classes.flatMap((c) => physicalClasses(c))).toEqual([])
})
