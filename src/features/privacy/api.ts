import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"

export type RequestKind = Schemas["RequestKind"]
export type RequestChannel = Schemas["RequestChannel"]
export type RequestStatus = Schemas["RequestStatus"]

export type DataRequestRow = Schemas["DataRequestRow"]

export type DataRequests = Schemas["DataRequestList"]

export const dataRequestsQuery = {
  queryKey: ["data-requests", "list"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/data-requests", { signal })),
}

export type NewDataRequest = Schemas["RecordDataRequestCommand"]

export const recordDataRequest = (input: NewDataRequest) =>
  dataOf(api.POST("/data-requests", { body: input }))

export type AccountChoice = { id: Uuid; name: string; email: string }

export const accountChoicesQuery = {
  queryKey: ["guardian-links"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/guardian-links", { signal })),
}
