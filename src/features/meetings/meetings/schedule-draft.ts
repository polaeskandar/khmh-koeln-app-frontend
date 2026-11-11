import type { Service } from "@/features/organization/services/api"
import type { IsoWeekday, LocalDate, MonthWeek, Recurrence, Uuid } from "@/lib/api/types/common"
import {
  normalizeWeekdays,
  occurrencesBetween,
  type RecurrenceProblem,
  recurrenceOf,
  validateRecurrence,
} from "@/lib/domain/recurrence"
import { addDays } from "@/lib/domain/time"

import type { RosterMode, ScheduleResponse } from "./api"
import type { Frequency } from "./api"
import type { ScheduleChanges, CreateSchedule } from "./api"

export type Draft = {
  serviceId: string
  stageId: string
  name: string
  description: string
  location: string
  frequency: Frequency
  interval: number
  weekdays: IsoWeekday[]
  monthWeek: MonthWeek
  monthWeekday: IsoWeekday
  startsOn: string
  endsOn: string
  startTime: string
  endTime: string
  rosterMode: RosterMode
}

export type DraftFieldsProps = {
  draft: Draft
  errors: Record<string, string>
  onChange: (changes: Partial<Draft>) => void
}

export type ScheduleTarget =
  { mode: "create"; fixedServiceId?: Uuid } | { mode: "edit"; schedule: ScheduleResponse }

export type Preview =
  | { error: RecurrenceProblem; dates: LocalDate[]; recurrence: null }
  | { error: null; dates: LocalDate[]; recurrence: Recurrence }

export const INTERVALS: Record<Frequency, number[]> = {
  weekly: [1, 2, 3, 4],
  monthly: [1, 2, 3, 6],
}

const PREVIEW_DATES = 4
const PREVIEW_HORIZON_DAYS = 400
const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/

function draftOf(schedule: ScheduleResponse): Draft {
  const recurrence = recurrenceOf(schedule.recurrence)

  return {
    serviceId: schedule.service?.id ?? "",
    stageId: schedule.stage?.id ?? "",
    name: schedule.name,
    description: schedule.description ?? "",
    location: schedule.location ?? "",
    frequency: recurrence.frequency,
    interval: recurrence.interval,
    weekdays: recurrence.frequency === "weekly" ? recurrence.weekdays : [7],
    monthWeek: recurrence.monthWeek ?? 1,
    monthWeekday: recurrence.weekdays[0],
    startsOn: recurrence.span.startsOn,
    endsOn: recurrence.span.endsOn ?? "",
    startTime: schedule.startTime,
    endTime: schedule.endTime ?? "",
    rosterMode: schedule.rosterMode,
  }
}

export function initialDraft(target: ScheduleTarget, today: LocalDate, services: Service[]): Draft {
  if (target.mode === "edit") {
    return draftOf(target.schedule)
  }

  return {
    serviceId: target.fixedServiceId ?? services[0]?.id ?? "",
    stageId: "",
    name: "",
    description: "",
    location: "",
    frequency: "weekly",
    interval: 1,
    weekdays: [7],
    monthWeek: 1,
    monthWeekday: 6,
    startsOn: today,
    endsOn: "",
    startTime: "18:00",
    endTime: "19:30",
    rosterMode: "expected",
  }
}

export function withFrequency(draft: Draft, frequency: Frequency): Partial<Draft> {
  return {
    frequency,
    interval: INTERVALS[frequency].includes(draft.interval) ? draft.interval : 1,
  }
}

export function toRecurrence(draft: Draft): Recurrence {
  return {
    frequency: draft.frequency,
    interval: draft.interval,
    weekdays:
      draft.frequency === "weekly" ? normalizeWeekdays(draft.weekdays) : [draft.monthWeekday],
    monthWeek: draft.frequency === "monthly" ? draft.monthWeek : null,
    span: { startsOn: draft.startsOn, endsOn: draft.endsOn || null },
  }
}

export function previewOf(draft: Draft, today: LocalDate): Preview {
  if (!LOCAL_DATE.test(draft.startsOn) || Number.isNaN(Date.parse(draft.startsOn))) {
    return { error: "startsOn", dates: [], recurrence: null }
  }

  const recurrence = toRecurrence(draft)

  const problem = validateRecurrence(recurrence)

  if (problem) {
    return { error: problem, dates: [], recurrence: null }
  }

  const from = draft.startsOn > today ? draft.startsOn : today

  return {
    error: null,
    dates: occurrencesBetween(recurrence, from, addDays(from, PREVIEW_HORIZON_DAYS)).slice(
      0,
      PREVIEW_DATES
    ),
    recurrence,
  }
}

function blankToNull(text: string) {
  return text.trim() === "" ? null : text
}

function scheduleOf(draft: Draft) {
  return {
    details: {
      name: draft.name,
      description: blankToNull(draft.description),
      location: blankToNull(draft.location),
    },
    recurrence: toRecurrence(draft),
    times: { startTime: draft.startTime, endTime: draft.endTime || null },
  }
}

export function newScheduleOf(draft: Draft): CreateSchedule {
  return {
    ...scheduleOf(draft),
    roster: { serviceId: draft.serviceId, stageId: draft.stageId || null, mode: draft.rosterMode },
  }
}

export function scheduleChangesOf(draft: Draft): ScheduleChanges {
  return { ...scheduleOf(draft), rosterMode: draft.rosterMode }
}
