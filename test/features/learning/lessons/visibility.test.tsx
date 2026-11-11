import { screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { VisibilityNote } from "@/features/learning/lessons/visibility"

describe("VisibilityNote", () => {
  test.each([
    ["parents", "Parents and members see this"],
    ["servants", "Servants only"],
  ] as const)("the note for %s uses words and an icon, never colour alone", (who, words) => {
    renderWithProviders(<VisibilityNote who={who} />)
    expect(screen.getByText(words).querySelector("svg")).not.toBeNull()
  })
})
