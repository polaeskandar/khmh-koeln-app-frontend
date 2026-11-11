import type {
  ServiceInsight,
  serviceInsightsQuery,
  ServiceList,
  ServiceRow,
} from "@/features/organization/services/api"

export type ServiceInsightList = Awaited<ReturnType<(typeof serviceInsightsQuery)["queryFn"]>>

let n = 0
function service(
  name: string,
  {
    stages = [],
    memberCount = 0,
    archivedAt = null,
    description = null,
    tone = 1,
  }: {
    stages?: string[]
    memberCount?: number
    archivedAt?: string | null
    description?: string | null
    tone?: number
  } = {}
): ServiceRow {
  n++

  return {
    id: `0192f3a4-7b1c-7d2e-8f3a-${String(n).padStart(12, "0")}`,
    name,
    description,
    tone,
    archived: archivedAt !== null,
    archivedAt,
    stages: stages.map((stage, position) => ({
      id: `0192f3a4-7b1c-7d2e-8f3b-${String(n * 10 + position).padStart(12, "0")}`,
      name: stage,
      position,
    })),
    memberCount,
    serviceLevelMemberCount: 0,
  }
}

export const services: ServiceList = {
  items: [
    service("Sunday School", {
      stages: ["Kindergarten", "1st Class", "3rd Class"],
      memberCount: 42,
      description: "Classes for children after the liturgy",
    }),
    service("Youth Meeting", { memberCount: 18, tone: 2 }),
    service("Choir", { memberCount: 12, tone: 3, archivedAt: "2026-09-05T22:30:00Z" }),
    service("Deacons' School", { stages: ["Level 1", "Level 2"], memberCount: 9, tone: 4 }),
    service("Coptic Course", { stages: ["Beginners"], memberCount: 7, tone: 5 }),
    service("Family Meeting", { memberCount: 30, tone: 6 }),
    service("Bible Study", { memberCount: 105, tone: 7 }),
    service("Scouts", { stages: ["Cubs"], memberCount: 25, tone: 8 }),
  ],
}

const insight = (
  serviceId: string,
  extra: Partial<Omit<ServiceInsight, "serviceId">> = {}
): ServiceInsight => ({
  serviceId,
  next: null,
  trend: { sessions: 0, rate: null, averagePresent: null },
  impact: { activeSchedules: 0, upcomingSessions: 0 },
  ...extra,
})

export const insightsOf = (
  rows: ServiceRow[],
  extra: Record<string, Partial<Omit<ServiceInsight, "serviceId">>> = {}
): ServiceInsightList => ({
  items: rows.map((row) => insight(row.id, extra[row.id])),
})
