import { screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import type { MeetingView } from "@/features/learning/lessons/api"
import { renderWithProviders } from "@test/support/providers"
import { MeetingLine } from "@/features/learning/lessons/meeting-line"

const TODAY = "2026-11-08"

describe("MeetingLine", () => {
  const session = (
    overrides: Partial<Extract<MeetingView, { kind: "session" }>> = {}
  ): MeetingView => ({
    kind: "session",
    id: "m1",
    status: "scheduled",
    date: TODAY,
    startTime: "12:00",
    endTime: "13:15",
    title: "Sunday class",
    location: "Room 4",
    cancelReason: null,
    ...overrides,
  })

  const line = (meeting: MeetingView) => {
    const { container } = renderWithProviders(<MeetingLine meeting={meeting} today={TODAY} />)

    return container.textContent?.replace(/[⁨⁩]/g, "")
  }

  test("none", () => {
    expect(line({ kind: "none", date: "2026-11-15" })).toMatch(/no meeting linked/)
  })

  test("planned says when its session is created", () => {
    expect(
      line({
        kind: "planned",
        date: "2026-11-15",
        startTime: "12:00",
        title: "Sunday class",
        createdOn: "2026-11-14",
      })
    ).toMatch(/session is created on Sat 14 Nov$/)
  })

  test("active today", () => {
    expect(line(session({ status: "active" }))).toBe(
      "Sunday class, today 12:00–13:15 · Room 4 · attendance open now"
    )
  })

  test("held", () => {
    expect(line(session({ status: "completed" }))).toMatch(/· held$/)
  })

  test("canceled, with an Arabic reason isolated in <bdi>", () => {
    const { container } = renderWithProviders(
      <MeetingLine
        meeting={session({ status: "canceled", cancelReason: "زيارة الأسقف" })}
        today={TODAY}
      />
    )

    expect(container.querySelector("bdi")).toHaveTextContent("زيارة الأسقف")
    expect(container.textContent).toMatch(/^The meeting on Sun 8 Nov was canceled/)
  })

  test("a date the schedule no longer has is a warning", () => {
    renderWithProviders(
      <MeetingLine
        meeting={{ kind: "not-on-schedule", date: "2026-11-15", title: null }}
        today={TODAY}
      />
    )

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The schedule no longer meets on Sun 15 Nov."
    )
  })
})
