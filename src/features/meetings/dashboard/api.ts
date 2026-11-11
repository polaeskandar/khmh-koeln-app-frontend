import { queryOptions } from "@tanstack/react-query"

import { api, dataOf } from "@/lib/api/client"
import { DASHBOARD_KEY } from "@/lib/api/query-keys"

import type { Agenda } from "../meetings/api"

export type Upcoming = Agenda

export const upcomingQuery = queryOptions({
  queryKey: [...DASHBOARD_KEY, "upcoming"],
  queryFn: ({ signal }) => dataOf(api.GET("/dashboard/upcoming", { signal })),
})
