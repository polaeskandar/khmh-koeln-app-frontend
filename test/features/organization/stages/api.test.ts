import { expect, test } from "vitest"

import { STAGE_QUERIES } from "@/features/organization/stages/api"
import { refetchedBy } from "@test/support/queries"

test("a stage change refetches the stages and the services", () => {
  expect(refetchedBy(STAGE_QUERIES)).toEqual([
    "services",
    "serviceInsights",
    "service",
    "serviceStages",
    "serviceServants",
    "stage",
    "stageAttendanceHistory",
  ])
})
