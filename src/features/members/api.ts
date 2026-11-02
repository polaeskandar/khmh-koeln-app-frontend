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

export type DirectoryPerson = Schemas["DirectoryEntry"]

export const directoryQuery = (q: string) => ({
  queryKey: ["people", "directory", q] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/people/directory", { params: { query: { q } }, signal })),
})
