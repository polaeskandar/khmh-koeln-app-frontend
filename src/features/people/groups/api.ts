import { queryOptions, useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import { MEMBER_KEY } from "@/lib/api/query-keys"

export type MemberGroup = Schemas["MemberGroupResponse"]

export type GroupServant = Schemas["GroupServant"]

export const memberGroupsQuery = queryOptions({
  queryKey: [...MEMBER_KEY, "groups"],
  queryFn: ({ signal }) => dataOf(api.GET("/member/groups", { signal })),
})

const memberServantsQuery = queryOptions({
  queryKey: [...MEMBER_KEY, "servants"],
  queryFn: ({ signal }) => dataOf(api.GET("/member/servants", { signal })),
})

export function useMemberServants(): GroupServant[] {
  return useQuery(memberServantsQuery).data?.items ?? []
}
