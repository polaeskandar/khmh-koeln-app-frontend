import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"

export type AccountRequest = Schemas["AccountRequestListResponse"]["items"][number]

export const accountRequestsQuery = {
  queryKey: ["accountRequests", "list"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/account-requests", { signal })),
}

export const declineRequest = (account: Uuid) =>
  dataOf(
    api.POST("/account-requests/{id}/decline", { params: { path: { id: account } }, body: {} })
  )

export type StaffAccount = Schemas["StaffAccount"]

export const staffAccountsQuery = {
  queryKey: ["staff-accounts"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/staff-accounts", { signal })),
}

export type AgeCheck = Schemas["AgeCheck"]

export type Approval = Schemas["ApprovalRequest"]

export const approveRequest = (account: Uuid, approval: Approval) =>
  dataOf(
    api.POST("/account-requests/{id}/approve", {
      params: { path: { id: account } },
      body: approval,
    })
  )

export type MemberCandidate = Schemas["MemberCandidateResponse"]

export const memberCandidatesQuery = (q: string) => ({
  queryKey: ["accountRequests", "memberCandidates", q] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/account-requests/member-candidates", { params: { query: { q } }, signal })),
})

export type MemberAccount = Schemas["MemberAccountItemResponse"]

export const memberAccountsQuery = {
  queryKey: ["member-accounts"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/member-accounts", { signal })),
}

export const unlinkMemberRequest = (account: Uuid) =>
  dataOf(api.POST("/member-accounts/{id}/unlink", { params: { path: { id: account } }, body: {} }))

export const giveRoleRequest = (account: Uuid, roleId: Uuid) =>
  dataOf(api.POST("/accounts/{id}/roles", { params: { path: { id: account } }, body: { roleId } }))

export const removeRoleRequest = (account: Uuid, roleId: Uuid) =>
  dataOf(api.DELETE("/accounts/{id}/roles/{roleId}", { params: { path: { id: account, roleId } } }))

export type PasswordLink = Schemas["IssuedPasswordLink"]

export const passwordLinkRequest = (account: Uuid) =>
  dataOf(api.POST("/accounts/{id}/password-link", { params: { path: { id: account } }, body: {} }))
