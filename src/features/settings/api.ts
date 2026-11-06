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

export type StaffAccount = Schemas["StaffAccount"]

export const staffAccountsQuery = {
  queryKey: ["staff-accounts"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/staff-accounts", { signal })),
}

export type Role = Schemas["RoleRow"]

export const rolesQuery = {
  queryKey: ["roles", "list"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/roles", { signal })),
}

export const giveRoleRequest = (account: Uuid, roleId: Uuid) =>
  dataOf(api.POST("/accounts/{id}/roles", { params: { path: { id: account } }, body: { roleId } }))

export const removeRoleRequest = (account: Uuid, roleId: Uuid) =>
  dataOf(api.DELETE("/accounts/{id}/roles/{roleId}", { params: { path: { id: account, roleId } } }))

export type PasswordLink = Schemas["PasswordLink"]

export const passwordLinkRequest = (account: Uuid) =>
  dataOf(api.POST("/accounts/{id}/password-link", { params: { path: { id: account } }, body: {} }))
