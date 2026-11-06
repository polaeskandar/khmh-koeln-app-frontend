import type { Schemas } from "@/lib/api/client"

export type Action = Schemas["Action"]

export type Resource = Schemas["Resource"]

export const ACTIONS: Action[] = ["read", "create", "update", "delete"]

export const RESOURCES: Resource[] = [
  "users",
  "roles",
  "services",
  "stages",
  "sessions",
  "attendance",
  "members",
  "lessons",
  "homework",
  "parentPortal",
]

export const PERMISSION_COUNT = ACTIONS.length * RESOURCES.length

export type Permission = Schemas["PermissionGrant"]

export type Can = (action: Action, resource: Resource) => boolean

export const can = (me: { permissions: Permission[] } | null, action: Action, resource: Resource) =>
  me?.permissions.some((p) => p.action === action && p.resource === resource) ?? false
