import type { Schemas } from "@/lib/api/client"

export const ACTIONS = ["create", "read", "update", "delete"] as const

export const RESOURCES = [
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
] as const

export type Action = (typeof ACTIONS)[number]

export type Resource = (typeof RESOURCES)[number]

export type Permission = Schemas["PermissionResponse"]

export const can = (me: { permissions: Permission[] } | null, action: Action, resource: Resource) =>
  me?.permissions.some((p) => p.action === action && p.resource === resource) ?? false
