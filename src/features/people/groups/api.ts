import { useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import { MEMBER_KEY } from "@/lib/api/query-keys"

export type MemberGroup = Schemas["MemberGroupResponse"]

export type GroupServant = Schemas["GroupServant"]

export const memberGroupsQuery = () => ({
  queryKey: [...MEMBER_KEY, "groups"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/member/groups", { signal })),
})

export const useMemberGroups = () => useQuery(memberGroupsQuery())

export const memberServantsQuery = {
  queryKey: [...MEMBER_KEY, "servants"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/member/servants", { signal })),
}

export const useMemberServants = (): GroupServant[] =>
  useQuery(memberServantsQuery).data?.items ?? []
