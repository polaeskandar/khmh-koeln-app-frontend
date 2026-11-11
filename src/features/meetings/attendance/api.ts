import { queryOptions, useQueries, type UseQueryResult } from "@tanstack/react-query"

import { api, dataOf, type Schemas } from "@/lib/api/client"
import {
  AGENDA_KEY,
  ATTENDANCE_KEY,
  DASHBOARD_KEY,
  SESSIONS_KEY,
  STAGES_KEY,
} from "@/lib/api/query-keys"
import type { Counts, Uuid } from "@/lib/api/types/common"
import type { CountedSession, SessionView } from "@/lib/api/types/meetings"

import type { MeetingSession } from "../meetings/api"

export type AttendanceOverview = Schemas["AttendanceOverviewResponse"]

export type OverviewCard = AttendanceOverview["sessions"][number]

export const attendanceOverviewQuery = queryOptions({
  queryKey: [...ATTENDANCE_KEY, "overview"],
  queryFn: ({ signal }) => dataOf(api.GET("/attendance/overview", { signal })),
})

export const overviewSessionIds = (overview: AttendanceOverview): Uuid[] =>
  [...overview.sessions, ...overview.earlier, ...overview.closed].map((card) => card.session.id)

const COUNTS_PER_REQUEST = 100

export type AttendanceCounts = Schemas["AttendanceCountsResponse"]

const attendanceCountsQuery = (sessionIds: Uuid[]) =>
  queryOptions({
    queryKey: [...ATTENDANCE_KEY, "counts", sessionIds],
    queryFn: ({ signal }) =>
      dataOf(
        api.GET("/attendance/counts", { params: { query: { "sessionIds[]": sessionIds } }, signal })
      ),
  })

const countsById = (results: UseQueryResult<AttendanceCounts>[]): Map<Uuid, Counts> =>
  new Map(
    results
      .flatMap((result) => result.data?.items ?? [])
      .map((item) => [item.sessionId, item.counts])
  )

function chunksOf<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size)
  )
}

export function useAttendanceCounts(sessionIds: Uuid[]): Map<Uuid, Counts> {
  const chunks = chunksOf([...new Set(sessionIds)], COUNTS_PER_REQUEST)

  return useQueries({ queries: chunks.map(attendanceCountsQuery), combine: countsById })
}

export const withCounts = (session: SessionView, counts: Map<Uuid, Counts>): CountedSession => ({
  ...session,
  counts: counts.get(session.id) ?? null,
})

export type Mark = Schemas["MarkReference"]

export type Placement = Schemas["PersonGroup"]

export type Correction = Schemas["Correction"]

export type AttendanceBoard = Schemas["AttendanceBoardResponse"]

export const attendanceBoardQuery = (session: Uuid) =>
  queryOptions({
    queryKey: [...ATTENDANCE_KEY, "board", session],
    queryFn: ({ signal }) =>
      dataOf(api.GET("/sessions/{id}/attendance", { params: { path: { id: session } }, signal })),
  })

export const attendanceCorrectionsQuery = (session: Uuid) =>
  queryOptions({
    queryKey: [...ATTENDANCE_KEY, "corrections", session],
    queryFn: ({ signal }) =>
      dataOf(
        api.GET("/sessions/{id}/attendance/corrections", {
          params: { path: { id: session } },
          signal,
        })
      ),
  })

export type SessionState = Schemas["SessionStateResponse"]

export type BoardSession = SessionView & Pick<SessionState, "openedAt" | "closedAt" | "closedBy">

export type AttendanceSheet = AttendanceBoard &
  Pick<MeetingSession, "today" | "history"> & { session: BoardSession; corrections: Correction[] }

export const sheetOf = (
  detail: MeetingSession,
  board: AttendanceBoard,
  corrections: Correction[]
): AttendanceSheet => ({
  ...board,
  today: detail.today,
  history: detail.history,
  session: {
    ...detail.session,
    openedAt: detail.state.openedAt,
    closedAt: detail.state.closedAt,
    closedBy: detail.state.closedBy,
  },
  corrections,
})

export const openAttendanceRequest = (session: Uuid) =>
  dataOf(api.POST("/sessions/{id}/open", { params: { path: { id: session } }, body: {} }))

export const reopenAttendanceRequest = (session: Uuid, reason: string | null) =>
  dataOf(api.POST("/sessions/{id}/reopen", { params: { path: { id: session } }, body: { reason } }))

export const closeAttendanceRequest = (session: Uuid) =>
  dataOf(api.POST("/sessions/{id}/close", { params: { path: { id: session } }, body: {} }))

export const recordMarkRequest = (session: Uuid, person: Uuid, signal?: AbortSignal) =>
  dataOf(
    api.PUT("/sessions/{sessionId}/attendance/{personId}", {
      params: { path: { sessionId: session, personId: person } },
      body: {},
      signal,
    })
  )

export const removeMarkRequest = (
  session: Uuid,
  person: Uuid,
  reason: string | null,
  signal?: AbortSignal
) =>
  dataOf(
    api.DELETE("/sessions/{sessionId}/attendance/{personId}", {
      params: { path: { sessionId: session, personId: person } },
      body: reason ? { reason } : {},
      signal,
    })
  )

export type HistoryCell = "present" | "notMarked" | "notOnRoster"

export type StageAttendanceHistory = Schemas["AttendanceHistory"]

export const stageAttendanceHistoryQuery = (id: Uuid) =>
  queryOptions({
    queryKey: [...STAGES_KEY, "attendance-history", id],
    queryFn: ({ signal }) =>
      dataOf(api.GET("/stages/{id}/attendance-history", { params: { path: { id } }, signal })),
  })

export const MARK_QUERIES = [ATTENDANCE_KEY]

export const ATTENDANCE_QUERIES = [ATTENDANCE_KEY, SESSIONS_KEY]

export const SESSION_STATUS_QUERIES = [ATTENDANCE_KEY, SESSIONS_KEY, AGENDA_KEY, DASHBOARD_KEY]
