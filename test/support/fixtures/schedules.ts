import type { ScheduleSummary } from "@/lib/api/types/meetings"

import { stageRef, sundaySchool } from "@test/support/fixtures/sessions"

let n = 0

export function schedule(overrides: Partial<ScheduleSummary> = {}): ScheduleSummary {
  n++

  return {
    id: `0192f3a4-7b1c-7d2e-8f3f-${String(n).padStart(12, "0")}`,
    name: "Sunday class",
    description: null,
    service: sundaySchool,
    stage: stageRef("3rd Class", 2),
    recurrence: {
      frequency: "weekly",
      interval: 1,
      weekdays: [7],
      monthWeek: null,
      span: { startsOn: "2026-09-06", endsOn: null },
    },
    startTime: "12:00",
    endTime: "13:00",
    location: "Hall 1",
    rosterMode: "expected",
    active: true,
    generating: true,
    nextDates: [],
    rosterSize: 9,
    sessionCount: 9,
    createdAt: "2026-09-01T10:00:00+02:00",
    updatedAt: "2026-09-01T10:00:00+02:00",
    ...overrides,
  }
}
