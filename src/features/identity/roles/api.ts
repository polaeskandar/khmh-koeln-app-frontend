import { queryOptions } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"
import { ROLES_KEY, ME_KEY, STAFF_ACCOUNTS_KEY } from "@/lib/api/query-keys"

export type Action = Schemas["Action"]

export type Resource = Schemas["Resource"]

export type RoleScope = Schemas["RoleScope"]

export type Permission = Schemas["PermissionResponse"]

export type RoleRow = Schemas["RoleRowResponse"]

export const rolesQuery = queryOptions({
  queryKey: [...ROLES_KEY, "list"],
  queryFn: ({ signal }) => dataOf(api.GET("/roles", { signal })),
})

export const parentPortalOnly = (role: RoleRow) =>
  role.permissions.length > 0 && role.permissions.every((p) => p.resource === "parentPortal")

export const deleteRoleRequest = (role: Uuid) =>
  dataOf(api.DELETE("/roles/{id}", { params: { path: { id: role } }, body: {} }))

export type RoleDetails = Schemas["RoleDetailsResponse"]

export const roleQuery = (id: Uuid) =>
  queryOptions({
    queryKey: [...ROLES_KEY, "detail", id],
    queryFn: ({ signal }) => dataOf(api.GET("/roles/{id}", { params: { path: { id } }, signal })),
  })

export type RoleRequest = Schemas["RoleRequest"]

export const createRoleRequest = (input: RoleRequest) => dataOf(api.POST("/roles", { body: input }))

export const updateRoleRequest = (id: Uuid, input: RoleRequest) =>
  dataOf(api.PUT("/roles/{id}", { params: { path: { id } }, body: input }))

export const ROLE_QUERIES = [ROLES_KEY, STAFF_ACCOUNTS_KEY, ME_KEY]
