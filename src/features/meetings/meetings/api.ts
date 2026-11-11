import { queryOptions } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type { LocalDate, Uuid } from "@/lib/api/types/common"

export type ScheduleList = Schemas["ScheduleListResponse"]

export const schedulesQuery = queryOptions({
  queryKey: ["schedules", "list"],
  queryFn: ({ signal }) => dataOf(api.GET("/schedules", { signal })),
})

export const serviceSchedulesQuery = (serviceId: Uuid) =>
  queryOptions({
    queryKey: ["schedules", "list", { serviceId }],
    queryFn: ({ signal }) =>
      dataOf(api.GET("/schedules", { params: { query: { serviceId } }, signal })),
  })

export type Agenda = Schemas["AgendaResponse"]

export type AgendaFilter = { from?: LocalDate; to?: LocalDate; serviceId?: Uuid; scheduleId?: Uuid }

export const agendaQuery = (filter: AgendaFilter) =>
  queryOptions({
    queryKey: ["agenda", "list", filter],
    queryFn: ({ signal }) => dataOf(api.GET("/agenda", { params: { query: filter }, signal })),
  })

export type MeetingSession = Schemas["SessionDetailResponse"]

export const meetingSessionQuery = (id: Uuid) =>
  queryOptions({
    queryKey: ["sessions", "detail", id],
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

export type ScheduleRequest = Schemas["CreateScheduleRequest"]

export type ScheduleChanges = Schemas["ScheduleChangesRequest"]

export const createScheduleRequest = (request: ScheduleRequest) =>
  dataOf(api.POST("/schedules", { body: request }))

export const updateScheduleRequest = (id: Uuid, changes: ScheduleChanges) =>
  dataOf(api.PUT("/schedules/{id}", { params: { path: { id } }, body: changes }))

export const scheduleQuery = (id: Uuid) =>
  queryOptions({
    queryKey: ["schedules", "detail", id],
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
  queryKey: ["member", "meetings"],
  queryFn: ({ signal }) => dataOf(api.GET("/member/meetings", { signal })),
})
