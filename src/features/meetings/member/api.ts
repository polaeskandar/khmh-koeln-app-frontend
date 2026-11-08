import { useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"

export type MemberMeeting = Schemas["MemberMeeting"]

export const memberMeetingsQuery = () => ({
  queryKey: ["member", "meetings"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/member/meetings", { signal })),
})

export const useMemberMeetings = () => useQuery(memberMeetingsQuery())
