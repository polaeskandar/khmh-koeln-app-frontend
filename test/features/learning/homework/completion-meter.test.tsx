import { describe, expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { CompletionMeter } from "@/features/learning/homework/completion-meter"

describe("CompletionMeter", () => {
  test("4 of 14 reads as reported and fills 29%", () => {
    const { container } = renderWithProviders(<CompletionMeter completed={4} assigned={14} />)
    expect(container.textContent).toBe("4 of 14 reported done")
    expect((container.querySelector("[aria-hidden] > span") as HTMLElement).style.width).toBe("29%")
  })

  test("nothing assigned leaves the bar empty", () => {
    const { container } = renderWithProviders(<CompletionMeter completed={0} assigned={0} />)
    expect((container.querySelector("[aria-hidden] > span") as HTMLElement).style.width).toBe("0%")
  })
})
