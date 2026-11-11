import { describe, expect, test } from "vitest"

import { agendaSession, plannedDate } from "@test/support/fixtures/agenda"

import { agendaHref } from "@/features/meetings/meetings/agenda-links"

describe("agendaHref", () => {
  const id = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f99"

  test.each([
    ["active", `/attendance/take/?session=${id}`],
    ["completed", `/attendance/summary/?session=${id}`],
    ["scheduled", `/meetings/sessions/view/?id=${id}`],
    ["canceled", `/meetings/sessions/view/?id=${id}`],
  ] as const)("%s → %s", (status, href) => {
    expect(agendaHref(agendaSession({ status }))).toBe(href)
  })

  test("a planned date opens its schedule", () => {
    const item = plannedDate("2026-11-15")
    expect(agendaHref(item)).toBe(`/meetings/schedules/view/?id=${item.scheduleId}`)
  })
})
