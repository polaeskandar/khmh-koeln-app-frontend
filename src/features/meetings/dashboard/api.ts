import { queryOptions } from "@tanstack/react-query"

import { api, dataOf } from "@/lib/api/client"

import type { Agenda } from "../meetings/api"

export type Upcoming = Agenda

export const upcomingQuery = queryOptions({
  queryKey: ["dashboard", "upcoming"],
  queryFn: ({ signal }) => dataOf(api.GET("/dashboard/upcoming", { signal })),
})
