import { useQuery } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import type {
  AccountRef,
  Instant,
  PersonRef,
  ServiceRef,
  StageRef,
  Uuid,
} from "@/lib/api/types/common"

export type OverviewSession = Schemas["OverviewCard"]
export type AttendanceOverview = Schemas["AttendanceOverview"]

export const attendanceOverviewQuery = {
  queryKey: ["attendance", "overview"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/attendance/overview", { signal })),
}

export const useAttendanceOverview = () => useQuery(attendanceOverviewQuery)

export type Mark = { id: Uuid; recordedAt: Instant; recordedBy: AccountRef }

export type Placement = { service: ServiceRef; stage: StageRef | null }

export type Correction = {
  id: Uuid
  person: PersonRef
  recordedAt: Instant
  recordedBy: AccountRef
  removedAt: Instant
  removedBy: AccountRef
  reason: string | null
}

export type AttendanceBoard = Schemas["AttendanceBoard"]

export const attendanceBoardQuery = (session: Uuid) => ({
  queryKey: ["attendance", "board", session] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/sessions/{id}/attendance", { params: { path: { id: session } }, signal })),
})

export const useAttendanceBoard = (session: Uuid) => useQuery(attendanceBoardQuery(session))

export type SessionState = Schemas["SessionState"]

export const openAttendanceRequest = (session: Uuid) =>
  dataOf(api.POST("/sessions/{id}/open", { params: { path: { id: session } }, body: {} }))
