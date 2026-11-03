import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"

export type AccountRequest = Schemas["AccountRequest"]

export const accountRequestsQuery = {
  queryKey: ["accountRequests", "list"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/account-requests", { signal })),
}

export const declineRequest = (account: Uuid) =>
  dataOf(
    api.POST("/account-requests/{id}/decline", { params: { path: { id: account } }, body: {} })
  )

export type MemberAccount = Schemas["MemberAccountItem"]

export const memberAccountsQuery = {
  queryKey: ["member-accounts"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/member-accounts", { signal })),
}

export const unlinkMemberRequest = (account: Uuid) =>
  dataOf(api.POST("/member-accounts/{id}/unlink", { params: { path: { id: account } }, body: {} }))
