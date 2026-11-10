import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"
import { GUARDIAN_LINKS_KEY } from "@/lib/api/query-keys"

export type GuardianLink = Schemas["ParentAccessItemResponse"]

export type GuardianLinks = Schemas["ParentAccessListResponse"]

export const guardianLinksQuery = {
  queryKey: GUARDIAN_LINKS_KEY,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/guardian-links", { signal })),
}

export type NewGuardianLink = Schemas["ParentAccessRequest"]

export const giveAccessRequest = (link: NewGuardianLink) =>
  dataOf(api.POST("/guardian-links", { body: link }))

export const revokeAccessRequest = (link: Uuid) =>
  dataOf(api.POST("/guardian-links/{id}/revoke", { params: { path: { id: link } }, body: {} }))

export const GUARDIAN_LINK_QUERIES = [GUARDIAN_LINKS_KEY]
