import { queryOptions, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"
import { SERVICES_KEY, AGENDA_KEY, SCHEDULES_KEY, STAGES_KEY } from "@/lib/api/query-keys"

export type ServiceInsight = Schemas["ServiceInsight"]

export type Trend = ServiceInsight["trend"]

export type Impact = Schemas["ArchiveImpact"]

export type ServiceRow = Schemas["ServiceResponse"]

export type ServiceList = Schemas["ServiceListResponse"]

export const serviceInsightsQuery = queryOptions({
  queryKey: [...SERVICES_KEY, "insights", { status: "all" }],
  queryFn: ({ signal }) =>
    dataOf(api.GET("/services/insights", { params: { query: { status: "all" } }, signal })),
})

export function useServiceInsights(): Map<Uuid, ServiceInsight> {
  const { data } = useQuery(serviceInsightsQuery)

  return useMemo(() => new Map(data?.items.map((item) => [item.serviceId, item])), [data])
}

export function useServiceInsight(id: Uuid): ServiceInsight | null {
  return useServiceInsights().get(id) ?? null
}

export const servicesQuery = queryOptions({
  queryKey: [...SERVICES_KEY, "list", { status: "all" }],
  queryFn: ({ signal }) =>
    dataOf(api.GET("/services", { params: { query: { status: "all" } }, signal })),
})

export type ServiceFields = { name: string; description: string | null }

export const createServiceRequest = (fields: ServiceFields) =>
  dataOf(api.POST("/services", { body: fields }))

export const updateServiceRequest = (id: Uuid, fields: ServiceFields) =>
  dataOf(api.PUT("/services/{id}", { params: { path: { id } }, body: fields }))

export const serviceQuery = (id: Uuid) =>
  queryOptions({
    queryKey: [...SERVICES_KEY, "detail", id],
    queryFn: ({ signal }) =>
      dataOf(api.GET("/services/{id}", { params: { path: { id } }, signal })),
  })

export type ServiceStages = Schemas["StageListResponse"]

export const serviceStagesQuery = (id: Uuid) =>
  queryOptions({
    queryKey: [...SERVICES_KEY, "stages", id],
    queryFn: ({ signal }) =>
      dataOf(api.GET("/services/{id}/stages", { params: { path: { id } }, signal })),
  })

export type ServiceServant = Schemas["ServiceServant"]

export type ServantAccount = Schemas["AccountReference"]

export const serviceServantsQuery = (id: Uuid) =>
  queryOptions({
    queryKey: [...SERVICES_KEY, "servants", id],
    queryFn: ({ signal }) =>
      dataOf(api.GET("/services/{id}/servants", { params: { path: { id } }, signal })),
  })

type Structure = "services" | "stages"

export const archiveRequest = (kind: Structure, id: Uuid) =>
  kind === "services"
    ? dataOf(api.POST("/services/{id}/archive", { params: { path: { id } }, body: {} }))
    : dataOf(api.POST("/stages/{id}/archive", { params: { path: { id } }, body: {} }))

export const restoreRequest = (kind: Structure, id: Uuid) =>
  kind === "services"
    ? dataOf(api.POST("/services/{id}/restore", { params: { path: { id } }, body: {} }))
    : dataOf(api.POST("/stages/{id}/restore", { params: { path: { id } }, body: {} }))

export const deleteRequest = (kind: Structure, id: Uuid) =>
  kind === "services"
    ? dataOf(api.DELETE("/services/{id}", { params: { path: { id } } }))
    : dataOf(api.DELETE("/stages/{id}", { params: { path: { id } } }))

export const SERVICE_QUERIES = [SERVICES_KEY]

export const STRUCTURE_QUERIES = [SERVICES_KEY, STAGES_KEY, SCHEDULES_KEY, AGENDA_KEY]
