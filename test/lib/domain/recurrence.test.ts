import { describe, expect, test } from "vitest"

import type { Recurrence } from "@/lib/api/types/common"
import cases from "@/lib/domain/recurrence-cases.json"
import {
  occurrencesBetween,
  type RecurrenceProblem,
  validateRecurrence,
} from "@/lib/domain/recurrence"

const FIXTURE_COMMIT = "backend f3af3f2 (PR #164, tests/Fixtures/recurrence-cases.json)"

const PROBLEMS: RecurrenceProblem[] = [
  "interval",
  "weekdays",
  "weekdayRange",
  "monthlyOneDay",
  "monthWeek",
  "monthWeekOnlyMonthly",
  "endBeforeStart",
]

describe(`the backend's golden vectors, from ${FIXTURE_COMMIT}`, () => {
  test.each(cases.occurrences)("$name", ({ recurrence, from, to, dates }) => {
    expect(occurrencesBetween(recurrence as Recurrence, from, to)).toEqual(dates)
  })

  test.each(cases.errors)("$name", ({ recurrence, error }) => {
    expect(`recurrence.${validateRecurrence(recurrence as Recurrence)}`).toBe(error.code)
  })

  test.each(cases.occurrences)("$name has no problem", ({ recurrence }) => {
    expect(validateRecurrence(recurrence as Recurrence)).toBeNull()
  })

  test("every problem has a case", () => {
    const covered = new Set(cases.errors.map(({ error }) => error.code))
    expect(PROBLEMS.filter((problem) => !covered.has(`recurrence.${problem}`))).toEqual([])
  })
})

describe("every other Monday from Sun 8 Nov 2026", () => {
  const everyOtherMonday: Recurrence = {
    frequency: "weekly",
    interval: 2,
    weekdays: [1],
    monthWeek: null,
    span: { startsOn: "2026-11-08", endsOn: null },
  }

  test("crosses ISO week 53 into January", () => {
    expect(occurrencesBetween(everyOtherMonday, "2026-11-08", "2027-01-11")).toEqual([
      "2026-11-16",
      "2026-11-30",
      "2026-12-14",
      "2026-12-28",
      "2027-01-11",
    ])
  })
})
