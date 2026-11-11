import { expect, test } from "vitest"

import { MEMBERSHIP_QUERIES, PERSON_NAME_QUERIES } from "@/features/people/members/api"
import { refetchedBy } from "@test/support/queries"

test("a membership change refetches the people, the services and the stages", () => {
  expect(refetchedBy(MEMBERSHIP_QUERIES)).toEqual([
    "services",
    "serviceInsights",
    "service",
    "serviceStages",
    "serviceServants",
    "stage",
    "stageAttendanceHistory",
    "people",
    "personRow",
    "directory",
  ])
})

test("a new name refetches the people and the services", () => {
  expect(refetchedBy(PERSON_NAME_QUERIES)).toEqual([
    "services",
    "serviceInsights",
    "service",
    "serviceStages",
    "serviceServants",
    "people",
    "personRow",
    "directory",
  ])
})
