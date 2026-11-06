import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"

export type Placement = Schemas["PlacementRow"]

export type PersonRow = Schemas["PersonRow"]

export type PeopleList = Schemas["PeoplePage"]

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

export type PersonNames = { firstName: string; lastName: string; displayName: string | null }

export const renamePersonRequest = (person: Uuid, changes: Partial<PersonNames>) =>
  dataOf(api.PATCH("/people/{id}", { params: { path: { id: person } }, body: changes }))

export const joinRequest = (person: Uuid, placement: { serviceId: Uuid; stageId: Uuid | null }) =>
  dataOf(
    api.POST("/people/{id}/memberships", { params: { path: { id: person } }, body: placement })
  )

export const endMembershipRequest = (membership: Uuid) =>
  dataOf(api.POST("/memberships/{id}/end", { params: { path: { id: membership } }, body: {} }))

export const deactivatePersonRequest = (person: Uuid) =>
  dataOf(api.POST("/people/{id}/deactivate", { params: { path: { id: person } }, body: {} }))

export const reactivatePersonRequest = (person: Uuid) =>
  dataOf(api.POST("/people/{id}/reactivate", { params: { path: { id: person } }, body: {} }))
