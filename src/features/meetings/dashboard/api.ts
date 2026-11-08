import { useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"

export type Dashboard = Schemas["Dashboard"]

export const dashboardQuery = {
  queryKey: ["dashboard"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/dashboard", { signal })),
}

export const useDashboard = () =>
  useQuery({ ...dashboardQuery, refetchInterval: 60_000, refetchOnWindowFocus: true })
