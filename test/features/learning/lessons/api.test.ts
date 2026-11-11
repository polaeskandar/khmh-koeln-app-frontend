import { expect, test } from "vitest"

import { LESSON_ARCHIVE_QUERIES, LESSON_QUERIES } from "@/features/learning/lessons/api"
import { refetchedBy } from "@test/support/queries"

test("a lesson change refetches the lessons", () => {
  expect(refetchedBy(LESSON_QUERIES)).toEqual(["lesson", "stageLessons", "lessonOptions"])
})

test("archiving, restoring or deleting a lesson refetches the lessons and the homework", () => {
  expect(refetchedBy(LESSON_ARCHIVE_QUERIES)).toEqual([
    "lesson",
    "stageLessons",
    "lessonOptions",
    "stageHomework",
    "homework",
    "homeworkProgress",
  ])
})
