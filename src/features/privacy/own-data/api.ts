import { queryOptions } from "@tanstack/react-query"

import { api, apiDownload, dataOf, type Schemas } from "@/lib/api/client"
import { ME_KEY } from "@/lib/api/query-keys"

import { DATA_COPY_FILE } from "../data-copy/api"

export const erasureRequestQuery = queryOptions({
  queryKey: [...ME_KEY, "erasure-request"],
  queryFn: ({ signal }) => dataOf(api.GET("/me/erasure-request", { signal })),
})

export const ERASURE_REQUEST_QUERIES = [erasureRequestQuery.queryKey]

export const requestErasureRequest = (body: Schemas["OwnErasureRequestRequest"]) =>
  dataOf(api.POST("/me/erasure-request", { body }))

export const downloadOwnDataRequest = () =>
  apiDownload(api.GET("/me/personal-data", { parseAs: "blob" }), DATA_COPY_FILE)
