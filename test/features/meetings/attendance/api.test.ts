import { expect, test } from "vitest"

import {
  ATTENDANCE_QUERIES,
  MARK_QUERIES,
  SESSION_STATUS_QUERIES,
} from "@/features/meetings/attendance/api"
import { refetchedBy } from "@test/support/queries"

test("a mark refetches the attendance and the stage histories", () => {
  expect(refetchedBy(MARK_QUERIES)).toEqual([
    "stageAttendanceHistory",
    "attendanceOverview",
    "attendanceBoard",
    "attendanceCorrections",
  ])
})

test("a correction refetches the attendance, the stage histories and the session", () => {
  expect(refetchedBy(ATTENDANCE_QUERIES)).toEqual([
    "stageAttendanceHistory",
    "session",
    "attendanceOverview",
    "attendanceBoard",
    "attendanceCorrections",
  ])
})

test("opening, closing or reopening refetches the session's status wherever it shows", () => {
  expect(refetchedBy(SESSION_STATUS_QUERIES)).toEqual([
    "stageAttendanceHistory",
    "agenda",
    "session",
    "attendanceOverview",
    "attendanceBoard",
    "attendanceCorrections",
    "upcoming",
  ])
})
