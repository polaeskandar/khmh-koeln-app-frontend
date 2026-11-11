import { describe, expect, test } from "vitest"

import {
  type Draft,
  initialDraft,
  newScheduleOf,
  previewOf,
  scheduleChangesOf,
  toRecurrence,
  withFrequency,
} from "@/features/meetings/meetings/schedule-draft"

const today = "2026-11-08"

const sundays = initialDraft({ mode: "create", fixedServiceId: "service-1" }, today, [])

const draft = (changes: Partial<Draft>): Draft => ({ ...sundays, ...changes })

describe("toRecurrence", () => {
  test.each([
    {
      name: "weekly sorts and dedupes the weekdays and sends no month week",
      draft: draft({ weekdays: [5, 1, 5], interval: 2 }),
      recurrence: {
        frequency: "weekly",
        interval: 2,
        weekdays: [1, 5],
        monthWeek: null,
        span: { startsOn: today, endsOn: null },
      },
    },
    {
      name: "monthly sends its one weekday and month week, not the weekly days",
      draft: draft({ frequency: "monthly", monthWeek: -1, monthWeekday: 5, weekdays: [7] }),
      recurrence: {
        frequency: "monthly",
        interval: 1,
        weekdays: [5],
        monthWeek: -1,
        span: { startsOn: today, endsOn: null },
      },
    },
    {
      name: "a last date ends the span",
      draft: draft({ endsOn: "2026-12-31" }),
      recurrence: {
        frequency: "weekly",
        interval: 1,
        weekdays: [7],
        monthWeek: null,
        span: { startsOn: today, endsOn: "2026-12-31" },
      },
    },
  ])("$name", ({ draft, recurrence }) => {
    expect(toRecurrence(draft)).toEqual(recurrence)
  })
})

describe("previewOf", () => {
  test.each([
    {
      name: "every Sunday from today lists the next four",
      draft: sundays,
      dates: ["2026-11-08", "2026-11-15", "2026-11-22", "2026-11-29"],
    },
    {
      name: "every other Monday starts from the first Monday",
      draft: draft({ weekdays: [1], interval: 2 }),
      dates: ["2026-11-16", "2026-11-30", "2026-12-14", "2026-12-28"],
    },
    {
      name: "a start in the future counts from the start",
      draft: draft({ startsOn: "2027-01-01" }),
      dates: ["2027-01-03", "2027-01-10", "2027-01-17", "2027-01-24"],
    },
    {
      name: "a span ending soon lists only what is left",
      draft: draft({ endsOn: "2026-11-16" }),
      dates: ["2026-11-08", "2026-11-15"],
    },
  ])("$name", ({ draft, dates }) => {
    expect(previewOf(draft, today)).toMatchObject({ error: null, dates })
  })

  test.each([
    { name: "no weekday", draft: draft({ weekdays: [] }), error: "weekdays" },
    {
      name: "an end before the start",
      draft: draft({ endsOn: "2026-11-01" }),
      error: "endBeforeStart",
    },
    { name: "no first date", draft: draft({ startsOn: "" }), error: "startsOn" },
    {
      name: "a first date that isn't one",
      draft: draft({ startsOn: "2026-13-45" }),
      error: "startsOn",
    },
  ])("$name is a problem without dates", ({ draft, error }) => {
    expect(previewOf(draft, today)).toEqual({ error, dates: [], recurrence: null })
  })
})

describe("withFrequency", () => {
  test("keeps an interval the new frequency offers", () => {
    expect(withFrequency(draft({ interval: 2 }), "monthly")).toEqual({
      frequency: "monthly",
      interval: 2,
    })
  })

  test("drops one it doesn't offer to 1", () => {
    expect(withFrequency(draft({ interval: 4 }), "monthly")).toEqual({
      frequency: "monthly",
      interval: 1,
    })
  })
})

describe("the requests", () => {
  const filled = draft({
    name: "Choir",
    description: "  ",
    location: "Hall",
    stageId: "",
    endTime: "",
  })

  test("a new schedule sends its roster with blank optionals as null", () => {
    expect(newScheduleOf(filled)).toEqual({
      details: { name: "Choir", description: null, location: "Hall" },
      recurrence: toRecurrence(filled),
      times: { startTime: "18:00", endTime: null },
      roster: { serviceId: "service-1", stageId: null, mode: "expected" },
    })
  })

  test("changes send the roster mode without the roster", () => {
    expect(scheduleChangesOf(draft({ rosterMode: "open" }))).toMatchObject({ rosterMode: "open" })
    expect(scheduleChangesOf(filled)).not.toHaveProperty("roster")
  })
})
