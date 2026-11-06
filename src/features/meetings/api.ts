import { useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"

export type ScheduleList = Schemas["ScheduleList"]

export const schedulesQuery = {
  queryKey: ["schedules", "list"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/schedules", { signal })),
}

export const useSchedules = () => useQuery(schedulesQuery)
