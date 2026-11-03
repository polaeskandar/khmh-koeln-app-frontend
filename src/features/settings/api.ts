import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { PersonRef, ServiceRef, StageRef, Uuid } from "@/lib/api/types/common"

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

export type StaffAccount = Schemas["StaffAccount"]

export const staffAccountsQuery = {
  queryKey: ["staff-accounts"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/staff-accounts", { signal })),
}

export type Role = Schemas["RoleRow"]

export type RoleRow = Role

export const rolesQuery = {
  queryKey: ["roles", "list"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/roles", { signal })),
}

export const roleListQuery = rolesQuery

export const parentPortalOnly = (role: Role) =>
  role.permissions.length > 0 && role.permissions.every((p) => p.resource === "parentPortal")

export type AgeCheck = "sixteenOrOlder" | "guardianConsent"

export type Approval =
  | { as: "parent"; childIds: Uuid[]; roleIds: Uuid[] }
  | { as: "servant"; roleIds: Uuid[] }
  | { as: "member"; personId: Uuid; ageCheck: AgeCheck; guardianConsentNote: string | null }

export const approveRequest = (account: Uuid, approval: Approval) =>
  dataOf(
    api.POST("/account-requests/{id}/approve", {
      params: { path: { id: account } },
      body: approval,
    })
  )

export type DirectoryPerson = PersonRef & {
  groups: { service: ServiceRef; stage: StageRef | null }[]
}

export const directorySearchQuery = (q: string) => ({
  queryKey: ["people", "directory", q] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/people/directory", { params: { query: { q } }, signal })),
})

export type GuardianLink = Schemas["ParentAccessItem"]

export type GuardianLinks = Schemas["ParentAccess"]

export const guardianLinksQuery = {
  queryKey: ["guardian-links"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/guardian-links", { signal })),
}

export const giveAccessRequest = (link: { userId: Uuid; personId: Uuid }) =>
  dataOf(api.POST("/guardian-links", { body: link }))

export const revokeAccessRequest = (link: Uuid) =>
  dataOf(api.POST("/guardian-links/{id}/revoke", { params: { path: { id: link } }, body: {} }))

export type MemberCandidate = DirectoryPerson & { hasAccount: boolean }

export const memberCandidatesQuery = (q: string) => ({
  queryKey: ["accountRequests", "memberCandidates", q] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/account-requests/member-candidates", { params: { query: { q } }, signal })),
})

export type MemberAccount = Schemas["MemberAccountItem"]

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

export type PasswordLink = Schemas["PasswordLink"]

export const passwordLinkRequest = (account: Uuid) =>
  dataOf(api.POST("/accounts/{id}/password-link", { params: { path: { id: account } }, body: {} }))

export const deleteRoleRequest = (role: Uuid) =>
  dataOf(api.DELETE("/roles/{id}", { params: { path: { id: role } }, body: {} }))
