import { api, dataOf } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"
import type { Group } from "@/lib/permissions"
import { ME_KEY, SERVICES_KEY, STAFF_ACCOUNTS_KEY } from "@/lib/api/query-keys"

export type GroupOption = { id: Uuid; name: string; stages: { id: Uuid; name: string }[] }

export type Place = { service: { name: string }; stage: { name: string } | null }

export const ASSIGNMENT_QUERIES = [STAFF_ACCOUNTS_KEY, [...SERVICES_KEY, "servants"], ME_KEY]

export const whereOf = (place: Place) =>
  place.stage ? `${place.service.name} · ${place.stage.name}` : place.service.name

export const assignRequest = (account: Uuid, group: Group) =>
  dataOf(api.POST("/accounts/{id}/assignments", { params: { path: { id: account } }, body: group }))

export const removeAssignmentRequest = (id: Uuid) =>
  dataOf(api.DELETE("/assignments/{id}", { params: { path: { id } } }))
