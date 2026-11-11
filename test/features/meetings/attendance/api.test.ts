import { expect, test } from "vitest"

import {
  ATTENDANCE_QUERIES,
  MARK_QUERIES,
  SESSION_STATUS_QUERIES,
} from "@/features/meetings/attendance/api"
import { refetchedBy } from "@test/support/queries"

test("a mark refetches the attendance", () => {
  expect(refetchedBy(MARK_QUERIES)).toEqual([
    "attendanceOverview",
    "attendanceBoard",
    "attendanceCorrections",
  ])
})

test("a correction refetches the attendance and the session", () => {
  expect(refetchedBy(ATTENDANCE_QUERIES)).toEqual([
    "session",
    "attendanceOverview",
    "attendanceBoard",
    "attendanceCorrections",
  ])
})

test("opening, closing or reopening refetches the session's status wherever it shows", () => {
  expect(refetchedBy(SESSION_STATUS_QUERIES)).toEqual([
    "agenda",
    "session",
    "attendanceOverview",
    "attendanceBoard",
    "attendanceCorrections",
    "upcoming",
  ])
})
