import { describe, expect, test } from "vitest"

import { attendanceStepOf, isDue } from "@/features/meetings/attendance/next-step"
import type { SessionStatus } from "@/features/meetings/meetings/api"
import type { Can } from "@/lib/permissions"

const TODAY = "2026-11-11"

const granting =
  (...granted: ("create" | "read")[]): Can =>
  (action, resource) =>
    resource === "attendance" && granted.includes(action as "create" | "read")

const session = (status: SessionStatus, date = TODAY) => ({ status, date })

describe("attendanceStepOf", () => {
  test.each<[string, SessionStatus, string, Can, "take" | "open" | "view" | null]>([
    ["an open session, for who records", "active", TODAY, granting("create", "read"), "take"],
    ["an open session, for who only reads", "active", TODAY, granting("read"), null],
    ["a planned session today, for who records", "scheduled", TODAY, granting("create"), "open"],
    [
      "a planned session in the past, for who records",
      "scheduled",
      "2026-11-04",
      granting("create"),
      "open",
    ],
    [
      "a planned session tomorrow, for who records",
      "scheduled",
      "2026-11-12",
      granting("create"),
      null,
    ],
    ["a planned session today, for who only reads", "scheduled", TODAY, granting("read"), null],
    ["a closed session, for who reads", "completed", TODAY, granting("read"), "view"],
    ["a closed session, for who only records", "completed", TODAY, granting("create"), null],
    ["a canceled session", "canceled", TODAY, granting("create", "read"), null],
  ])("%s", (_, status, date, can, step) => {
    expect(attendanceStepOf(session(status, date), TODAY, can)).toBe(step)
  })
})

describe("isDue", () => {
  test.each<[SessionStatus, string, boolean]>([
    ["scheduled", TODAY, true],
    ["scheduled", "2026-11-04", true],
    ["scheduled", "2026-11-12", false],
    ["active", TODAY, false],
    ["completed", "2026-11-04", false],
    ["canceled", TODAY, false],
  ])("a %s session on %s is due: %s", (status, date, due) => {
    expect(isDue(session(status, date), TODAY)).toBe(due)
  })
})
