import { renderHook, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import type { Locale } from "@/i18n/config"
import type { MeetingView } from "@/lib/api/types/learning"
import { addDays } from "@/lib/domain/time"
import { renderWithProviders, testProviders } from "@test/support/providers"

import { useDueLabel } from "@/features/learning/homework/homework-bits"
import {
  CompletionMeter,
  HomeworkStatusBadge,
  LessonStatusBadge,
  MeetingLine,
} from "@/features/learning/lessons/lesson-bits"
import { VisibilityNote } from "@/features/learning/lessons/visibility"

const TODAY = "2026-11-08"

function dueLabels(locale: Locale) {
  const { wrapper } = testProviders({ locale })

  return renderHook(() => useDueLabel(), { wrapper }).result.current
}

describe("dueLabel", () => {
  const cases: [string | null, string][] = [
    ["2026-11-08", "Due today"],
    ["2026-11-09", "Due tomorrow"],
    ["2026-11-12", "Due Thu, in 4 days"],
    ["2026-11-15", "Due Sun 15 Nov"],
    ["2026-11-07", "Was due yesterday"],
    ["2026-11-01", "Was due Sun 1 Nov"],
    [null, "No due date"],
  ]

  test.each(cases)("%s reads %s", (due, label) => {
    expect(dueLabels("en")(due, TODAY)).toBe(label)
  })

  test.each(["de", "ar"] as const)("every case has its own text in %s", (locale) => {
    const due = dueLabels(locale)

    for (const [date, english] of cases) {
      const label = due(date, TODAY)
      expect(label).not.toBe(english)
      expect(label).not.toMatch(/[{}]|due\./)
    }
  })

  test("from 30 days before to 30 days after, never 'overdue' or 'late'", () => {
    const due = dueLabels("en")

    for (let days = -30; days <= 30; days++) {
      expect(due(addDays(TODAY, days), TODAY)).not.toMatch(/overdue|late/i)
    }
  })
})

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

describe("badges", () => {
  test.each(["draft", "ready", "completed"] as const)(
    "lesson %s shows an icon and a label",
    (status) => {
      const { container } = renderWithProviders(<LessonStatusBadge status={status} />)
      expect(container.querySelector("svg")).not.toBeNull()
      expect(container.textContent).not.toBe("")
    }
  )

  test("an archived ready lesson reads 'Archived'", () => {
    renderWithProviders(<LessonStatusBadge status="ready" archived />)
    expect(screen.getByText("Archived")).toBeInTheDocument()
  })

  test.each([
    ["draft", "Draft"],
    ["published", "Published"],
    ["archived", "Archived"],
  ] as const)("homework %s shows an icon and %s", (status, label) => {
    const { container } = renderWithProviders(<HomeworkStatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(container.querySelector("svg")).not.toBeNull()
  })

  test("VisibilityNote uses words and an icon, never colour alone", () => {
    const { container } = renderWithProviders(
      <>
        <VisibilityNote who="parents" />
        <VisibilityNote who="servants" />
      </>
    )

    expect(screen.getByText("Parents and members see this")).toBeInTheDocument()
    expect(screen.getByText("Servants only")).toBeInTheDocument()
    expect(container.querySelector(".lucide-eye")).not.toBeNull()
    expect(container.querySelector(".lucide-lock-keyhole")).not.toBeNull()
  })
})

describe("CompletionMeter", () => {
  test("4 of 14 reads as reported and fills 29%", () => {
    const { container } = renderWithProviders(<CompletionMeter completed={4} assigned={14} />)
    expect(container.textContent).toBe("4 of 14 reported done")
    expect((container.querySelector("[aria-hidden] > span") as HTMLElement).style.width).toBe("29%")
  })

  test("nothing assigned leaves the bar empty", () => {
    const { container } = renderWithProviders(<CompletionMeter completed={0} assigned={0} />)
    expect((container.querySelector("[aria-hidden] > span") as HTMLElement).style.width).toBe("0%")
  })
})
