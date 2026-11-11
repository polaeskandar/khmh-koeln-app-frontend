import { queryOptions } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"
import {
  ACCOUNT_REQUESTS_KEY,
  MEMBER_ACCOUNTS_KEY,
  STAFF_ACCOUNTS_KEY,
  GUARDIAN_LINKS_KEY,
  ROLES_KEY,
} from "@/lib/api/query-keys"

export type AccountRequest = Schemas["AccountRequestListResponse"]["items"][number]

export const accountRequestsQuery = queryOptions({
  queryKey: [...ACCOUNT_REQUESTS_KEY, "list"],
  queryFn: ({ signal }) => dataOf(api.GET("/account-requests", { signal })),
})

export const declineRequest = (account: Uuid) =>
  dataOf(
    api.POST("/account-requests/{id}/decline", { params: { path: { id: account } }, body: {} })
  )

export type StaffAccount = Schemas["StaffAccountResponse"]

export const staffAccountsQuery = queryOptions({
  queryKey: STAFF_ACCOUNTS_KEY,
  queryFn: ({ signal }) => dataOf(api.GET("/staff-accounts", { signal })),
})

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

export const memberCandidatesQuery = (q: string) =>
  queryOptions({
    queryKey: [...ACCOUNT_REQUESTS_KEY, "memberCandidates", q],
    queryFn: ({ signal }) =>
      dataOf(api.GET("/account-requests/member-candidates", { params: { query: { q } }, signal })),
  })

export type MemberAccount = Schemas["MemberAccountItemResponse"]

export const memberAccountsQuery = queryOptions({
  queryKey: MEMBER_ACCOUNTS_KEY,
  queryFn: ({ signal }) => dataOf(api.GET("/member-accounts", { signal })),
})

export const unlinkMemberRequest = (account: Uuid) =>
  dataOf(api.POST("/member-accounts/{id}/unlink", { params: { path: { id: account } }, body: {} }))

export const giveRoleRequest = (account: Uuid, roleId: Uuid) =>
  dataOf(api.POST("/accounts/{id}/roles", { params: { path: { id: account } }, body: { roleId } }))

export const removeRoleRequest = (account: Uuid, roleId: Uuid) =>
  dataOf(api.DELETE("/accounts/{id}/roles/{roleId}", { params: { path: { id: account, roleId } } }))

export type PasswordLink = Schemas["IssuedPasswordLink"]

export const passwordLinkRequest = (account: Uuid) =>
  dataOf(api.POST("/accounts/{id}/password-link", { params: { path: { id: account } }, body: {} }))

export const ACCOUNT_REQUEST_QUERIES = [ACCOUNT_REQUESTS_KEY]

export const STAFF_APPROVAL_QUERIES = [
  ACCOUNT_REQUESTS_KEY,
  STAFF_ACCOUNTS_KEY,
  ROLES_KEY,
  GUARDIAN_LINKS_KEY,
]

export const MEMBER_ACCOUNT_QUERIES = [MEMBER_ACCOUNTS_KEY, ACCOUNT_REQUESTS_KEY]
