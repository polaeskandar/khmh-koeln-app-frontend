import { queryOptions } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { Uuid } from "@/lib/api/types/common"
import type { Problem } from "@/lib/api/translate-problem"
import type { Group } from "@/lib/permissions"
import { PEOPLE_KEY, SERVICES_KEY, STAGES_KEY } from "@/lib/api/query-keys"

export type PersonReference = Schemas["PersonReference"]

export type PlacementRow = Schemas["PlacementRow"]

export type PersonRow = Schemas["PersonRow"]

export type PeoplePage = Schemas["PeoplePageResponse"]

export type PeopleQuery = Schemas["PeopleQueryRequest"]

export const peopleQuery = (filter: PeopleQuery) =>
  queryOptions({
    queryKey: [...PEOPLE_KEY, "list", filter],
    queryFn: ({ signal }) => dataOf(api.GET("/people", { params: { query: filter }, signal })),
  })

const SEARCH_LIMIT = 100

const nameSearch = (person: PersonRow["person"]) =>
  `${person.firstName} ${person.lastName}`.slice(0, SEARCH_LIMIT).trim()

export const personRowQuery = (person: PersonRow["person"], version: number) =>
  queryOptions({
    queryKey: [...PEOPLE_KEY, "detail", { id: person.id, version }],
    queryFn: async ({ signal }) => {
      const list = await dataOf(
        api.GET("/people", { params: { query: { status: "all", q: nameSearch(person) } }, signal })
      )

      return list.items.find((row) => row.person.id === person.id) ?? null
    },
  })

export type DirectoryEntry = Schemas["DirectoryEntry"]

export function duplicateCandidatesOf(problem: Problem | null): DirectoryEntry[] {
  if (problem?.code !== "people.duplicate") {
    return []
  }

  return (problem.extensions.candidates as DirectoryEntry[] | undefined) ?? []
}

export const directoryQuery = (q: string) =>
  queryOptions({
    queryKey: [...PEOPLE_KEY, "directory", q],
    queryFn: ({ signal }) =>
      dataOf(api.GET("/people/directory", { params: { query: { q } }, signal })),
  })

export const MEMBERSHIP_QUERIES = [PEOPLE_KEY, SERVICES_KEY, STAGES_KEY]

export const PERSON_NAME_QUERIES = [PEOPLE_KEY, SERVICES_KEY]

export type PlacementInput = Group

export type CreatePerson = Schemas["CreatePersonRequest"]

export const createPersonRequest = (person: CreatePerson) =>
  dataOf(api.POST("/people", { body: person }))

export const addMembershipRequest = (person: Uuid, placement: PlacementInput) =>
  dataOf(
    api.POST("/people/{id}/memberships", { params: { path: { id: person } }, body: placement })
  )

export type PersonNames = Pick<PersonRow["person"], "firstName" | "lastName" | "displayName">

export const renamePersonRequest = (person: Uuid, names: Schemas["RenamePersonRequest"]) =>
  dataOf(api.PUT("/people/{id}", { params: { path: { id: person } }, body: names }))

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
