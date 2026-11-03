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

export type RoleRow = Schemas["RoleRow"]

export const roleListQuery = {
  queryKey: ["roles", "list"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/roles", { signal })),
}

export const deleteRoleRequest = (role: Uuid) =>
  dataOf(api.DELETE("/roles/{id}", { params: { path: { id: role } }, body: {} }))

export type RoleDetail = Schemas["RoleDetail"]

export const roleQuery = (id: Uuid) => ({
  queryKey: ["roles", "detail", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/roles/{id}", { params: { path: { id } }, signal })),
})

export type RoleInput = Schemas["RoleInput"]

export const createRoleRequest = (input: RoleInput) => dataOf(api.POST("/roles", { body: input }))

export const updateRoleRequest = (id: Uuid, input: RoleInput) =>
  dataOf(api.PUT("/roles/{id}", { params: { path: { id } }, body: input }))
