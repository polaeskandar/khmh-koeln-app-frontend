import { queryOptions } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"
import { GUARDIAN_LINKS_KEY } from "@/lib/api/query-keys"

export type ParentAccessItem = Schemas["ParentAccessItemResponse"]

export type ParentAccessList = Schemas["ParentAccessListResponse"]

export const guardianLinksQuery = queryOptions({
  queryKey: [...GUARDIAN_LINKS_KEY, "list"],
  queryFn: ({ signal }) => dataOf(api.GET("/guardian-links", { signal })),
})

export type ParentAccessRequest = Schemas["ParentAccessRequest"]

export const giveAccessRequest = (link: ParentAccessRequest) =>
  dataOf(api.POST("/guardian-links", { body: link }))

export const revokeAccessRequest = (link: Uuid) =>
  dataOf(api.POST("/guardian-links/{id}/revoke", { params: { path: { id: link } }, body: {} }))

export const GUARDIAN_LINK_QUERIES = [GUARDIAN_LINKS_KEY]
