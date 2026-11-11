import type { ServiceRef, StageRef } from "@/lib/api/types/common"
import type { AgendaItem, SessionItem } from "@/lib/api/types/meetings"

export const AGENDA_TODAY = "2026-11-08"

export const sundaySchoolRef: ServiceRef = {
  id: "s1",
  name: "Sunday School",
  tone: 1,
  archived: false,
}

export const youthRef: ServiceRef = { id: "s2", name: "Youth Meeting", tone: 2, archived: false }

export const thirdClassStage: StageRef = {
  id: "st3",
  name: "3rd Class",
  position: 2,
  archived: false,
}

export const firstClassStage: StageRef = {
  id: "st1",
  name: "1st Class",
  position: 0,
  archived: false,
}

export const agendaSession = (overrides: Partial<SessionItem> = {}): SessionItem => ({
  kind: "session",
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f99",
  scheduleId: "sch1",
  occurrenceDate: AGENDA_TODAY,
  title: "Sunday class",
  service: sundaySchoolRef,
  stage: thirdClassStage,
  date: AGENDA_TODAY,
  startTime: "12:00",
  endTime: "13:15",
  startsAt: "2026-11-08T12:00:00+01:00",
  endsAt: "2026-11-08T13:15:00+01:00",
  location: "Room 4",
  status: "scheduled",
  rosterMode: "expected",
  cancelReason: null,
  counts: null,
  ...overrides,
})

export const plannedDate = (date: string): AgendaItem => ({
  kind: "planned",
  scheduleId: "sch1",
  date,
  title: "Sunday class",
  service: sundaySchoolRef,
  stage: thirdClassStage,
  startTime: "12:00",
  endTime: "13:15",
  startsAt: `${date}T12:00:00+01:00`,
  endsAt: `${date}T13:15:00+01:00`,
  location: "Room 4",
  rosterMode: "expected",
})
