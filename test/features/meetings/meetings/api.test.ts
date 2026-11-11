import { expect, test } from "vitest"

import { SCHEDULE_DELETION_QUERIES, SCHEDULE_QUERIES } from "@/features/meetings/meetings/api"
import { refetchedBy } from "@test/support/queries"

test("a schedule or date change refetches the schedules, agenda, sessions, attendance, stage histories and dashboard", () => {
  expect(refetchedBy(SCHEDULE_QUERIES)).toEqual([
    "stageAttendanceHistory",
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
    "stageAttendanceHistory",
    "schedules",
    "serviceSchedules",
    "agenda",
    "attendanceOverview",
    "attendanceBoard",
    "attendanceCorrections",
    "upcoming",
  ])
})
