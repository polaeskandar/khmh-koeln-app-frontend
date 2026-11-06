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
