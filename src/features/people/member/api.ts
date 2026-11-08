import { useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"

export type MemberGroup = Schemas["MemberGroup"]

export const memberGroupsQuery = () => ({
  queryKey: ["member", "groups"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/member/groups", { signal })),
})

export const useMemberGroups = () => useQuery(memberGroupsQuery())
