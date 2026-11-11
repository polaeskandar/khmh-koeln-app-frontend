import { renderHook } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import type { Locale } from "@/i18n/config"
import { addDays } from "@/lib/domain/time"
import { testProviders } from "@test/support/providers"
import { useDueLabel } from "@/features/learning/homework/due-line"

const TODAY = "2026-11-08"

function dueLabels(locale: Locale) {
  const { wrapper } = testProviders({ locale })

  return renderHook(() => useDueLabel(), { wrapper }).result.current
}

describe("dueLabel", () => {
  const cases: [string | null, string][] = [
    ["2026-11-08", "Due today"],
    ["2026-11-09", "Due tomorrow"],
    ["2026-11-12", "Due Thu, in 4 days"],
    ["2026-11-15", "Due Sun 15 Nov"],
    ["2026-11-07", "Was due yesterday"],
    ["2026-11-01", "Was due Sun 1 Nov"],
    [null, "No due date"],
  ]

  test.each(cases)("%s reads %s", (due, label) => {
    expect(dueLabels("en")(due, TODAY)).toBe(label)
  })

  test.each(["de", "ar"] as const)("every case has its own text in %s", (locale) => {
    const due = dueLabels(locale)

    for (const [date, english] of cases) {
      const label = due(date, TODAY)
      expect(label).not.toBe(english)
      expect(label).not.toMatch(/[{}]|due\./)
    }
  })

  test("from 30 days before to 30 days after, never 'overdue' or 'late'", () => {
    const due = dueLabels("en")

    for (let days = -30; days <= 30; days++) {
      expect(due(addDays(TODAY, days), TODAY)).not.toMatch(/overdue|late/i)
    }
  })
})
