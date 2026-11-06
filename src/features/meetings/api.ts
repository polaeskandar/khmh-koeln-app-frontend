import { useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { AgendaItem } from "@/lib/api/types/meetings"
import type { LocalDate, Uuid } from "@/lib/api/types/common"

export type ScheduleList = Schemas["ScheduleList"]

export const schedulesQuery = {
  queryKey: ["schedules", "list"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/schedules", { signal })),
}

export const useSchedules = () => useQuery(schedulesQuery)

export type Agenda = Omit<Schemas["Agenda"], "items"> & { items: AgendaItem[] }

export type AgendaFilter = { from?: LocalDate; to?: LocalDate; serviceId?: Uuid }

export const agendaQuery = (filter: AgendaFilter) => ({
  queryKey: ["agenda", "list", filter] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/agenda", { params: { query: filter }, signal })),
})

export const useAgenda = (filter: AgendaFilter) => useQuery(agendaQuery(filter))
