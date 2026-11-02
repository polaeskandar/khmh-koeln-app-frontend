import { useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"

export type OverviewSession = Schemas["OverviewCard"]
export type AttendanceOverview = Schemas["AttendanceOverview"]

export const attendanceOverviewQuery = {
  queryKey: ["attendance", "overview"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/attendance/overview", { signal })),
}

export const useAttendanceOverview = () => useQuery(attendanceOverviewQuery)
