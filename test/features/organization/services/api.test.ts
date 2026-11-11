import { expect, test } from "vitest"

import { SERVICE_QUERIES, STRUCTURE_QUERIES } from "@/features/organization/services/api"
import { refetchedBy } from "@test/support/queries"

test("a service change refetches the services", () => {
  expect(refetchedBy(SERVICE_QUERIES)).toEqual([
    "services",
    "serviceInsights",
    "service",
    "serviceStages",
    "serviceServants",
  ])
})

test("archiving, restoring or deleting refetches the services, the stages, the schedules and the agenda", () => {
  expect(refetchedBy(STRUCTURE_QUERIES)).toEqual([
    "services",
    "serviceInsights",
    "service",
    "serviceStages",
    "serviceServants",
    "stage",
    "stageAttendanceHistory",
    "schedules",
    "serviceSchedules",
    "schedule",
    "agenda",
  ])
})
