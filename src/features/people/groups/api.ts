import { useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"

export type MemberGroup = Schemas["MemberGroupResponse"]

export type GroupServant = Schemas["GroupServant"]

export const memberGroupsQuery = () => ({
  queryKey: ["member", "groups"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/member/groups", { signal })),
})

export const useMemberGroups = () => useQuery(memberGroupsQuery())

export const memberServantsQuery = {
  queryKey: ["member", "servants"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/member/servants", { signal })),
}

export const useMemberServants = (): GroupServant[] =>
  useQuery(memberServantsQuery).data?.items ?? []
