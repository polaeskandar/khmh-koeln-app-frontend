import { api, dataOf, type Schemas } from "@/lib/api/client"

export type ServiceRow = Schemas["ServiceView"]

export type ServiceList = Schemas["ServiceList"]

export const servicesQuery = {
  queryKey: ["services", "list", { status: "all" }] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/services", { params: { query: { status: "all" } }, signal })),
}
