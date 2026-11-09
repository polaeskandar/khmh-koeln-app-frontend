import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"

export type Placement = Schemas["PlacementRow"]

export type PersonRow = Schemas["PersonRow"]

export type PeopleList = Schemas["PeoplePageResponse"]

export type PeopleFilter = {
  status?: "active" | "inactive" | "all"
  serviceId?: Uuid
  stageId?: Uuid
  q?: string
  page?: number
}

export const peopleQuery = (filter: PeopleFilter) => ({
  queryKey: ["people", "list", filter] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/people", { params: { query: filter }, signal })),
})

export type DirectoryPerson = Schemas["DirectoryEntry"]

export const directoryQuery = (q: string) => ({
  queryKey: ["people", "directory", q] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/people/directory", { params: { query: { q } }, signal })),
})

export type PlacementInput = { serviceId: Uuid; stageId: Uuid | null }

export type NewPerson = {
  firstName: string
  lastName: string
  displayName: string | null
  placement: PlacementInput | null
  confirmDuplicate?: boolean
}

export const createPersonRequest = (person: NewPerson) =>
  dataOf(api.POST("/people", { body: person }))

export const addMembershipRequest = (person: Uuid, placement: PlacementInput) =>
  dataOf(
    api.POST("/people/{id}/memberships", { params: { path: { id: person } }, body: placement })
  )

export type PersonNames = { firstName: string; lastName: string; displayName: string | null }

export const renamePersonRequest = (person: Uuid, names: PersonNames) =>
  dataOf(api.PUT("/people/{id}", { params: { path: { id: person } }, body: names }))

export const joinRequest = (person: Uuid, placement: { serviceId: Uuid; stageId: Uuid | null }) =>
  dataOf(
    api.POST("/people/{id}/memberships", { params: { path: { id: person } }, body: placement })
  )

export const endMembershipRequest = (membership: Uuid) =>
  dataOf(api.POST("/memberships/{id}/end", { params: { path: { id: membership } }, body: {} }))

export const moveMembershipRequest = (membership: Uuid, stageId: Uuid) =>
  dataOf(
    api.POST("/memberships/{id}/move", { params: { path: { id: membership } }, body: { stageId } })
  )

export const deactivatePersonRequest = (person: Uuid) =>
  dataOf(api.POST("/people/{id}/deactivate", { params: { path: { id: person } }, body: {} }))

export const reactivatePersonRequest = (person: Uuid) =>
  dataOf(api.POST("/people/{id}/reactivate", { params: { path: { id: person } }, body: {} }))
