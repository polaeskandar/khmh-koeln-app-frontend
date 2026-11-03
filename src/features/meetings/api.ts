import { useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { AgendaItem } from "@/lib/api/types/meetings"
import type { LocalDate, Recurrence, Uuid } from "@/lib/api/types/common"

export type ScheduleList = Schemas["ScheduleList"]

export const schedulesQuery = {
  queryKey: ["schedules", "list"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => dataOf(api.GET("/schedules", { signal })),
}

export const useSchedules = () => useQuery(schedulesQuery)

export const serviceSchedulesQuery = (serviceId: Uuid) => ({
  queryKey: ["schedules", "list", { serviceId }] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/schedules", { params: { query: { serviceId } }, signal })),
})

export type Agenda = Omit<Schemas["Agenda"], "items"> & { items: AgendaItem[] }

export type AgendaFilter = { from?: LocalDate; to?: LocalDate; serviceId?: Uuid; scheduleId?: Uuid }

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

export type ScheduleInput = {
  serviceId: Uuid
  stageId: Uuid | null
  name: string
  description: string | null
  location: string | null
  recurrence: Recurrence
  startTime: string
  endTime: string | null
  rosterMode: "expected" | "open"
}

export type ScheduleSaved = Schemas["ScheduleWritten"]

export const createScheduleRequest = (input: ScheduleInput) =>
  dataOf(api.POST("/schedules", { body: input }))

export const updateScheduleRequest = (
  id: Uuid,
  changes: Omit<ScheduleInput, "serviceId" | "stageId">
) => dataOf(api.PATCH("/schedules/{id}", { params: { path: { id } }, body: changes }))

export const scheduleQuery = (id: Uuid) => ({
  queryKey: ["schedules", "detail", id] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/schedules/{id}", { params: { path: { id } }, signal })),
})

export const activateScheduleRequest = (id: Uuid) =>
  dataOf(api.POST("/schedules/{id}/activate", { params: { path: { id } }, body: {} }))

export const deactivateScheduleRequest = (id: Uuid) =>
  dataOf(api.POST("/schedules/{id}/deactivate", { params: { path: { id } }, body: {} }))

export const deleteScheduleRequest = (id: Uuid) =>
  dataOf(api.DELETE("/schedules/{id}", { params: { path: { id } } }))
