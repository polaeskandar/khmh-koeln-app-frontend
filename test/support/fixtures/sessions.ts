import type { OverviewSession } from "@/features/meetings/attendance/api"
import type { StageRef } from "@/lib/api/types/common"

export const sundaySchool = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f10",
  name: "Sunday School",
  tone: 1,
  archived: false,
}

export const stageRef = (name: string, position: number): StageRef => ({
  id: `0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f2${position}`,
  name,
  position,
  archived: false,
})

export const thirdClassRef = stageRef("3rd Class", 2)

let n = 0

export function session(overrides: Partial<OverviewSession> = {}): OverviewSession {
  n++
  const date = overrides.date ?? "2026-11-08"

  return {
    id: `0192f3a4-7b1c-7d2e-8f3a-${String(n).padStart(12, "0")}`,
    scheduleId: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f90",
    oneOff: false,
    occurrenceDate: date,
    title: "Sunday School",
    service: sundaySchool,
    stage: thirdClassRef,
    date,
    startTime: "12:00",
    endTime: "13:00",
    startsAt: `${date}T12:00:00+01:00`,
    endsAt: `${date}T13:00:00+01:00`,
    location: "Hall 1",
    status: "scheduled",
    rosterMode: "expected",
    cancelReason: null,
    can: { manage: true, record: true, reopen: false },
    counts: { present: 0, rosterSize: 14, rosterPresent: 0, notMarked: 14, notOnRoster: 0 },
    openedAt: null,
    closedAt: null,
    closedBy: null,
    ...overrides,
  }
}
