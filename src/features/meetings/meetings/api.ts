import { queryOptions } from "@tanstack/react-query"

import { api, dataOf, type QueryParams, type Schemas } from "@/lib/api/client"
import {
  AGENDA_KEY,
  ATTENDANCE_HISTORY_KEY,
  ATTENDANCE_KEY,
  DASHBOARD_KEY,
  MEMBER_KEY,
  SCHEDULES_KEY,
  SESSIONS_KEY,
} from "@/lib/api/query-keys"
import type { LocalDate, Uuid } from "@/lib/api/types/common"
import type { AttendanceCounts } from "@/features/meetings/attendance/api"

export type Frequency = Schemas["Frequency"]

export type SessionStatus = Schemas["SessionStatus"]

export type RosterMode = Schemas["RosterMode"]

export type SessionView = Schemas["SessionResponse"] & { counts?: AttendanceCounts | null }

export type AgendaSession = Schemas["AgendaSessionResponse"]

export type CountedSession = Omit<AgendaSession, "kind">

export type PlannedSession = Schemas["PlannedSessionResponse"]

export type AgendaItem = Schemas["AgendaResponse"]["items"][number]

export type ScheduleResponse = Schemas["ScheduleResponse"]

export type HistoryEntry = Schemas["HistoryEntry"]

export type ScheduleListResponse = Schemas["ScheduleListResponse"]

export const schedulesQuery = queryOptions({
  queryKey: [...SCHEDULES_KEY, "list"],
  queryFn: ({ signal }) => dataOf(api.GET("/schedules", { signal })),
})

export const serviceSchedulesQuery = (serviceId: Uuid) =>
  queryOptions({
    queryKey: [...SCHEDULES_KEY, "list", { serviceId }],
    queryFn: ({ signal }) =>
      dataOf(api.GET("/schedules", { params: { query: { serviceId } }, signal })),
  })

export type Agenda = Schemas["AgendaResponse"]

export type AgendaFilter = QueryParams<"/agenda">

export const agendaQuery = (filter: AgendaFilter) =>
  queryOptions({
    queryKey: [...AGENDA_KEY, "list", filter],
    queryFn: ({ signal }) => dataOf(api.GET("/agenda", { params: { query: filter }, signal })),
  })

export type SessionDetailResponse = Schemas["SessionDetailResponse"]

export const meetingSessionQuery = (id: Uuid) =>
  queryOptions({
    queryKey: [...SESSIONS_KEY, "detail", id],
    queryFn: ({ signal }) =>
      dataOf(api.GET("/sessions/{id}", { params: { path: { id } }, signal })),
  })

export const cancelSessionRequest = (session: Uuid, reason: string | null) =>
  dataOf(api.POST("/sessions/{id}/cancel", { params: { path: { id: session } }, body: { reason } }))

export const cancelOccurrenceRequest = (schedule: Uuid, date: LocalDate, reason: string | null) =>
  dataOf(
    api.POST("/schedules/{id}/occurrences/{date}/cancel", {
      params: { path: { id: schedule, date } },
      body: { reason },
    })
  )

export type CreateSchedule = Schemas["CreateScheduleRequest"]

export type ScheduleChanges = Schemas["ScheduleChangesRequest"]

export const createScheduleRequest = (request: CreateSchedule) =>
  dataOf(api.POST("/schedules", { body: request }))

export const updateScheduleRequest = (id: Uuid, changes: ScheduleChanges) =>
  dataOf(api.PUT("/schedules/{id}", { params: { path: { id } }, body: changes }))

export const scheduleQuery = (id: Uuid) =>
  queryOptions({
    queryKey: [...SCHEDULES_KEY, "detail", id],
    queryFn: ({ signal }) =>
      dataOf(api.GET("/schedules/{id}", { params: { path: { id } }, signal })),
  })

export const activateScheduleRequest = (id: Uuid) =>
  dataOf(api.POST("/schedules/{id}/activate", { params: { path: { id } }, body: {} }))

export const deactivateScheduleRequest = (id: Uuid) =>
  dataOf(api.POST("/schedules/{id}/deactivate", { params: { path: { id } }, body: {} }))

export const deleteScheduleRequest = (id: Uuid) =>
  dataOf(api.DELETE("/schedules/{id}", { params: { path: { id } } }))

export type MemberMeeting = Schemas["MemberMeetingResponse"]

export const memberMeetingsQuery = queryOptions({
  queryKey: [...MEMBER_KEY, "meetings"],
  queryFn: ({ signal }) => dataOf(api.GET("/member/meetings", { signal })),
})

export const SCHEDULE_QUERIES = [
  SCHEDULES_KEY,
  AGENDA_KEY,
  SESSIONS_KEY,
  ATTENDANCE_KEY,
  ATTENDANCE_HISTORY_KEY,
  DASHBOARD_KEY,
]

export const SCHEDULE_DELETION_QUERIES = [
  [...SCHEDULES_KEY, "list"],
  AGENDA_KEY,
  ATTENDANCE_KEY,
  ATTENDANCE_HISTORY_KEY,
  DASHBOARD_KEY,
]
