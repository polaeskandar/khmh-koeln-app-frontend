import type { Schemas } from "@/lib/api/client"
import type { IsoWeekday, LocalDate, MonthWeek, Recurrence } from "@/lib/api/types/common"

import { addDays, daysBetween, daysInMonth, isoWeekday, mondayOf } from "./time"

export type RecurrenceProblem =
  | "interval"
  | "weekdays"
  | "weekdayRange"
  | "monthlyOneDay"
  | "monthWeek"
  | "monthWeekOnlyMonthly"
  | "endBeforeStart"
  | "startsOn"

export class RecurrenceError extends Error {
  constructor(readonly code: RecurrenceProblem) {
    super(code)
  }
}

export function validateRecurrence(r: Recurrence): void {
  if (!Number.isInteger(r.interval) || r.interval < 1 || r.interval > 52) {
    throw new RecurrenceError("interval")
  }

  if (r.weekdays.length === 0) {
    throw new RecurrenceError("weekdays")
  }

  if (r.weekdays.some((d) => d < 1 || d > 7)) {
    throw new RecurrenceError("weekdayRange")
  }

  if (r.frequency === "monthly") {
    if (r.weekdays.length !== 1) {
      throw new RecurrenceError("monthlyOneDay")
    }

    if (r.monthWeek === null || ![1, 2, 3, 4, -1].includes(r.monthWeek)) {
      throw new RecurrenceError("monthWeek")
    }
  } else if (r.monthWeek !== null) {
    throw new RecurrenceError("monthWeekOnlyMonthly")
  }

  if (r.span.endsOn !== null && r.span.endsOn < r.span.startsOn) {
    throw new RecurrenceError("endBeforeStart")
  }
}

export function normalizeWeekdays(days: number[]): IsoWeekday[] {
  return [...new Set(days)].sort((a, b) => a - b) as IsoWeekday[]
}

function monthsBetween(from: LocalDate, to: LocalDate): number {
  const [fy, fm] = from.split("-").map(Number)
  const [ty, tm] = to.split("-").map(Number)

  return ty * 12 + tm - (fy * 12 + fm)
}

function isRequestedWeekOfMonth(date: LocalDate, monthWeek: MonthWeek): boolean {
  const dayOfMonth = Number(date.slice(8, 10))

  return monthWeek === -1
    ? dayOfMonth + 7 > daysInMonth(date)
    : Math.ceil(dayOfMonth / 7) === monthWeek
}

export function occursOn(r: Recurrence, date: LocalDate): boolean {
  const { startsOn, endsOn } = r.span

  if (date < startsOn || (endsOn !== null && date > endsOn)) {
    return false
  }

  if (!r.weekdays.includes(isoWeekday(date))) {
    return false
  }

  if (r.frequency === "weekly") {
    const weeks = daysBetween(mondayOf(startsOn), mondayOf(date)) / 7

    return weeks % r.interval === 0
  }

  return (
    r.monthWeek !== null &&
    isRequestedWeekOfMonth(date, r.monthWeek) &&
    monthsBetween(startsOn, date) % r.interval === 0
  )
}

export function occurrencesBetween(r: Recurrence, from: LocalDate, to: LocalDate): LocalDate[] {
  const out: LocalDate[] = []

  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (occursOn(r, d)) {
      out.push(d)
    }
  }

  return out
}

const HORIZON_DAYS = 400

export function nextOccurrence(r: Recurrence, onOrAfter: LocalDate): LocalDate | null {
  for (let d = onOrAfter, i = 0; i < HORIZON_DAYS; d = addDays(d, 1), i++) {
    if (r.span.endsOn !== null && d > r.span.endsOn) {
      return null
    }

    if (occursOn(r, d)) {
      return d
    }
  }

  return null
}

const MONTH_WEEKS: MonthWeek[] = [1, 2, 3, 4, -1]

export function recurrenceOf(view: Schemas["RecurrenceSummary"]): Recurrence {
  return {
    ...view,
    weekdays: normalizeWeekdays(view.weekdays),
    monthWeek: MONTH_WEEKS.find((week) => week === view.monthWeek) ?? null,
  }
}
