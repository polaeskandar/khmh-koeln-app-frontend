import { expect, test } from "vitest"

import { SCHEDULE_DELETION_QUERIES, SCHEDULE_QUERIES } from "@/features/meetings/meetings/api"
import { refetchedBy } from "@test/support/queries"

test("a schedule or date change refetches the schedules, the agenda, the sessions, the attendance and the dashboard", () => {
  expect(refetchedBy(SCHEDULE_QUERIES)).toEqual([
    "schedules",
    "serviceSchedules",
    "schedule",
    "agenda",
    "session",
    "attendanceOverview",
    "attendanceBoard",
    "attendanceCorrections",
    "upcoming",
  ])
})

test("a deleted schedule refetches the lists, but not its own page", () => {
  expect(refetchedBy(SCHEDULE_DELETION_QUERIES)).toEqual([
    "schedules",
    "serviceSchedules",
    "agenda",
    "attendanceOverview",
    "attendanceBoard",
    "attendanceCorrections",
    "upcoming",
  ])
})
