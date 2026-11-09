import { useQuery } from "@tanstack/react-query"

import { api, dataOf } from "@/lib/api/client"

import type { Agenda } from "../meetings/api"

export type Upcoming = Agenda

const LIVE = { refetchInterval: 60_000, refetchOnWindowFocus: true }

export const upcomingQuery = {
  queryKey: ["dashboard", "upcoming"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/dashboard/upcoming", { signal })),
}

export const useUpcoming = () => useQuery({ ...upcomingQuery, ...LIVE })

export const DASHBOARD_REFRESH = LIVE
