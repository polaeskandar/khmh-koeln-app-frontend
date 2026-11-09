import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"

export type ServiceInsight = Schemas["ServiceInsight"]

export type Trend = ServiceInsight["trend"]

export type Impact = Schemas["ArchiveImpact"]

export type ServiceRow = Schemas["ServiceResponse"]

export type ServiceList = Schemas["ServiceListResponse"]

export const serviceInsightsQuery = {
  queryKey: ["services", "insights", { status: "all" }] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/services/insights", { params: { query: { status: "all" } }, signal })),
}

export function useServiceInsights(): Map<Uuid, ServiceInsight> {
  const { data } = useQuery(serviceInsightsQuery)

  return useMemo(() => new Map(data?.items.map((item) => [item.serviceId, item])), [data])
}

export const useServiceInsight = (id: Uuid): ServiceInsight | null =>
  useServiceInsights().get(id) ?? null

export const servicesQuery = {
  queryKey: ["services", "list", { status: "all" }] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/services", { params: { query: { status: "all" } }, signal })),
}

export type ServiceFields = { name: string; description: string | null }

export const createServiceRequest = (fields: ServiceFields) =>
  dataOf(api.POST("/services", { body: fields }))

export const updateServiceRequest = (id: Uuid, fields: ServiceFields) =>
  dataOf(api.PUT("/services/{id}", { params: { path: { id } }, body: fields }))

export const serviceQuery = (id: Uuid) => ({
  queryKey: ["services", "detail", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/services/{id}", { params: { path: { id } }, signal })),
})

export type ServiceStages = Schemas["StageListResponse"]

export const serviceStagesQuery = (id: Uuid) => ({
  queryKey: ["services", "stages", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/services/{id}/stages", { params: { path: { id } }, signal })),
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
