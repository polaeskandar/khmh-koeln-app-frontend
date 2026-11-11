import type { Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"

export const ACTIONS: Schemas["Action"][] = ["read", "create", "update", "delete"]

export const RESOURCES: Schemas["Resource"][] = [
  "services",
  "stages",
  "sessions",
  "attendance",
  "members",
  "lessons",
  "homework",
  "parentPortal",
  "users",
  "roles",
]

export const GROUP_RESOURCES: Schemas["Resource"][] = [
  "services",
  "stages",
  "sessions",
  "attendance",
  "members",
  "lessons",
  "homework",
]

export const SENSITIVE: Schemas["Resource"][] = ["members", "users", "roles"]

export const PERMISSION_COUNT = ACTIONS.length * RESOURCES.length

export type Group = { serviceId: Uuid; stageId: Uuid | null }

export const groupAt = (
  service: { id: Uuid },
  stage: { id: Uuid } | null | undefined = null
): Group => ({ serviceId: service.id, stageId: stage?.id ?? null })

export const meetingGroup = (meeting: {
  service: { id: Uuid } | null
  stage: { id: Uuid } | null
}): Group | undefined => (meeting.service ? groupAt(meeting.service, meeting.stage) : undefined)

export type AssignedGroup = { service: { id: Uuid }; stage: { id: Uuid } | null }

export type Holder = {
  permissions: Schemas["AccountPermissionResponse"][]
  assignments: AssignedGroup[]
}

export type Can = (
  action: Schemas["Action"],
  resource: Schemas["Resource"],
  group?: Group
) => boolean

export const within =
  (can: Can, group: Group | undefined): Can =>
  (action, resource, other) =>
    can(action, resource, other ?? group)

export const canInAny = (
  can: Can,
  action: Schemas["Action"],
  resource: Schemas["Resource"],
  groups: Group[]
) =>
  groups.length === 0 ? can(action, resource) : groups.some((group) => can(action, resource, group))

const covers = (assignments: AssignedGroup[], group: Group) =>
  assignments.some(
    (assignment) =>
      assignment.service.id === group.serviceId &&
      (assignment.stage === null || assignment.stage.id === group.stageId)
  )

const permissionOf = (me: Holder, action: Schemas["Action"], resource: Schemas["Resource"]) =>
  me.permissions.find(
    (permission) => permission.action === action && permission.resource === resource
  )

export function can(
  me: Holder | null,
  action: Schemas["Action"],
  resource: Schemas["Resource"],
  group?: Group
) {
  const permission = me ? permissionOf(me, action, resource) : undefined

  if (!me || !permission) {
    return false
  }

  if (permission.scope === "church" || !GROUP_RESOURCES.includes(resource)) {
    return true
  }

  return group ? covers(me.assignments, group) : me.assignments.length > 0
}

export function canAssign(me: Holder | null, group?: Group) {
  if (!me) {
    return false
  }

  const users = permissionOf(me, "update", "users")
  const stages = permissionOf(me, "update", "stages")

  if (users?.scope === "church" || stages?.scope === "church") {
    return true
  }

  if (!stages) {
    return false
  }

  const services = me.assignments.filter((assignment) => assignment.stage === null)

  return group
    ? services.some((assignment) => assignment.service.id === group.serviceId)
    : services.length > 0
}

export const isUnassigned = (me: Holder | null) =>
  me !== null &&
  me.assignments.length === 0 &&
  me.permissions.some((permission) => GROUP_RESOURCES.includes(permission.resource)) &&
  me.permissions.every(
    (permission) =>
      permission.scope === "assignedGroups" || !GROUP_RESOURCES.includes(permission.resource)
  )
