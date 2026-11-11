import type { ServiceReference } from "@/features/organization/services/api"
import type { StageReference } from "@/features/organization/stages/api"
import type { AgendaItem, AgendaSession } from "@/features/meetings/meetings/api"

export const AGENDA_TODAY = "2026-11-08"

export const sundaySchoolRef: ServiceReference = {
  id: "s1",
  name: "Sunday School",
  tone: 1,
  archived: false,
}

export const youthRef: ServiceReference = {
  id: "s2",
  name: "Youth Meeting",
  tone: 2,
  archived: false,
}

export const thirdClassStage: StageReference = {
  id: "st3",
  name: "3rd Class",
  position: 2,
  archived: false,
}

export const firstClassStage: StageReference = {
  id: "st1",
  name: "1st Class",
  position: 0,
  archived: false,
}

export const agendaSession = (overrides: Partial<AgendaSession> = {}): AgendaSession => ({
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
