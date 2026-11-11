import { expect, test } from "vitest"

import {
  CHILD_REPORT_QUERIES,
  HOMEWORK_QUERIES,
  HOMEWORK_SAVE_QUERIES,
  OWN_REPORT_QUERIES,
} from "@/features/learning/homework/api"
import { refetchedBy } from "@test/support/queries"

test("a homework change refetches the homework", () => {
  expect(refetchedBy(HOMEWORK_QUERIES)).toEqual(["stageHomework", "homework", "homeworkProgress"])
})

test("saving homework refetches the homework and the lessons, which count it", () => {
  expect(refetchedBy(HOMEWORK_SAVE_QUERIES)).toEqual([
    "lesson",
    "stageLessons",
    "lessonOptions",
    "stageHomework",
    "homework",
    "homeworkProgress",
  ])
})

test("a parent's report refetches the parent portal", () => {
  expect(refetchedBy(CHILD_REPORT_QUERIES)).toEqual(["parentChildren", "parentTask"])
})

test("a member's own report refetches the member portal", () => {
  expect(refetchedBy(OWN_REPORT_QUERIES)).toEqual([
    "memberGroups",
    "memberMeetings",
    "memberHomework",
    "memberTask",
  ])
})
