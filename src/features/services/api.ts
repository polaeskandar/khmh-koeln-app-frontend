import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { LocalDate, LocalTime, StageRef, Uuid } from "@/lib/api/types/common"

export type NextMeeting = {
  date: LocalDate
  startTime: LocalTime
  stage: StageRef | null
  status: "scheduled" | "active" | "planned"
}

export type Trend = { sessions: number; rate: number | null; averagePresent: number | null }

export type ServiceRow = Schemas["ServiceView"]

export type ServiceList = Schemas["ServiceList"]

export const servicesQuery = {
  queryKey: ["services", "list", { status: "all" }] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/services", { params: { query: { status: "all" } }, signal })),
}

export type ServiceFields = { name: string; description: string | null }

export const createServiceRequest = (fields: ServiceFields) =>
  dataOf(api.POST("/services", { body: fields }))

export const updateServiceRequest = (id: Uuid, changes: Partial<ServiceFields>) =>
  dataOf(api.PATCH("/services/{id}", { params: { path: { id } }, body: changes }))

export const serviceQuery = (id: Uuid) => ({
  queryKey: ["services", "detail", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/services/{id}", { params: { path: { id } }, signal })),
})

export type ServiceStages = Schemas["StageList"]

export const serviceStagesQuery = (id: Uuid) => ({
  queryKey: ["services", "stages", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/services/{id}/stages", { params: { path: { id } }, signal })),
})
