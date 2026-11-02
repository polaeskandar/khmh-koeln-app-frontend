import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"

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
