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

export type MeetingSession = Schemas["SessionDetail"]

export const meetingSessionQuery = (id: Uuid) => ({
  queryKey: ["sessions", "detail", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/sessions/{id}", { params: { path: { id } }, signal })),
})

export const useMeetingSession = (id: Uuid) => useQuery(meetingSessionQuery(id))

export const cancelSessionRequest = (session: Uuid, reason: string | null) =>
  dataOf(api.POST("/sessions/{id}/cancel", { params: { path: { id: session } }, body: { reason } }))

export const cancelOccurrenceRequest = (schedule: Uuid, date: LocalDate, reason: string | null) =>
  dataOf(
    api.POST("/schedules/{id}/occurrences/{date}/cancel", {
      params: { path: { id: schedule, date } },
      body: { reason },
    })
  )
