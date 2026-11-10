import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"
import type { Group } from "@/lib/permissions"

export type Assignment = Schemas["AssignmentView"]

export type GroupOption = { id: Uuid; name: string; stages: { id: Uuid; name: string }[] }

export const ASSIGNMENT_QUERIES = [["staff-accounts"], ["me"]]

export const whereOf = (assignment: Pick<Assignment, "service" | "stage">) =>
  assignment.stage
    ? `${assignment.service.name} · ${assignment.stage.name}`
    : assignment.service.name

export const assignRequest = (account: Uuid, group: Group) =>
  dataOf(api.POST("/accounts/{id}/assignments", { params: { path: { id: account } }, body: group }))

export const removeAssignmentRequest = (id: Uuid) =>
  dataOf(api.DELETE("/assignments/{id}", { params: { path: { id } } }))
