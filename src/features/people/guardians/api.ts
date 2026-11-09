import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"

export type GuardianLink = Schemas["ParentAccessItemResponse"]

export type GuardianLinks = Schemas["ParentAccessListResponse"]

export const guardianLinksQuery = {
  queryKey: ["guardian-links"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/guardian-links", { signal })),
}

export type NewGuardianLink = Schemas["ParentAccessRequest"]

export const giveAccessRequest = (link: NewGuardianLink) =>
  dataOf(api.POST("/guardian-links", { body: link }))

export const revokeAccessRequest = (link: Uuid) =>
  dataOf(api.POST("/guardian-links/{id}/revoke", { params: { path: { id: link } }, body: {} }))
