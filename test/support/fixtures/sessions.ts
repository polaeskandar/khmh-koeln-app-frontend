import { http, HttpResponse } from "msw"

import type {
  AttendanceCounts,
  OverviewCard,
  SessionState,
} from "@/features/meetings/attendance/api"
import type { MeetingSession } from "@/features/meetings/meetings/api"
import type { Schemas } from "@/lib/api/client"
import type { StageRef } from "@/lib/api/types/common"
import type { CountedSession, SessionView } from "@/lib/api/types/meetings"
import { apiUrl } from "@test/support/api"

export const sundaySchool = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f10",
  name: "Sunday School",
  tone: 1,
  archived: false,
}

export const stageRef = (name: string, position: number): StageRef => ({
  id: `0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f2${position}`,
  name,
  position,
  archived: false,
})

export const thirdClassRef = stageRef("3rd Class", 2)

let n = 0

export function session(overrides: Partial<CountedSession> = {}): CountedSession {
  n++
  const date = overrides.date ?? "2026-11-08"

  return {
    id: `0192f3a4-7b1c-7d2e-8f3a-${String(n).padStart(12, "0")}`,
    scheduleId: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f90",
    occurrenceDate: date,
    title: "Sunday School",
    service: sundaySchool,
    stage: thirdClassRef,
    date,
    startTime: "12:00",
    endTime: "13:00",
    startsAt: `${date}T12:00:00+01:00`,
    endsAt: `${date}T13:00:00+01:00`,
    location: "Hall 1",
    status: "scheduled",
    rosterMode: "expected",
    cancelReason: null,
    counts: { present: 0, rosterSize: 14, rosterPresent: 0, notMarked: 14, notOnRoster: 0 },
    ...overrides,
  }
}

export const sessionResponse = (view: SessionView): Schemas["SessionResponse"] => ({
  id: view.id,
  scheduleId: view.scheduleId,
  occurrenceDate: view.occurrenceDate,
  title: view.title,
  service: view.service,
  stage: view.stage,
  date: view.date,
  startTime: view.startTime,
  endTime: view.endTime,
  startsAt: view.startsAt,
  endsAt: view.endsAt,
  location: view.location,
  status: view.status,
  rosterMode: view.rosterMode,
  cancelReason: view.cancelReason,
})

export const sessionState = (
  view: SessionView,
  overrides: Partial<SessionState> = {}
): SessionState => ({
  id: view.id,
  status: view.status,
  openedAt: null,
  closedAt: null,
  closedBy: null,
  ...overrides,
})

export const card = (view: SessionView, state: Partial<SessionState> = {}): OverviewCard => ({
  session: sessionResponse(view),
  state: sessionState(view, state),
})

export const sessionDetail = (
  view: SessionView,
  extra: Partial<MeetingSession> = {}
): MeetingSession => ({
  today: "2026-11-08",
  session: sessionResponse(view),
  state: sessionState(view),
  schedule: null,
  history: [],
  ...extra,
})

export const countsOf = (views: SessionView[]): AttendanceCounts => ({
  items: views.flatMap((view) =>
    view.counts ? [{ sessionId: view.id, counts: view.counts }] : []
  ),
})

export const countsHandler = (views: SessionView[]) =>
  http.get(apiUrl("/attendance/counts"), ({ request }) => {
    const asked = new URL(request.url).searchParams.getAll("sessionIds[]")

    return HttpResponse.json(countsOf(views.filter((view) => asked.includes(view.id))))
  })
