import { screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { VisibilityNote } from "@/features/learning/lessons/visibility"

describe("VisibilityNote", () => {
  test("VisibilityNote uses words and an icon, never colour alone", () => {
    const { container } = renderWithProviders(
      <>
        <VisibilityNote who="parents" />
        <VisibilityNote who="servants" />
      </>
    )

    expect(screen.getByText("Parents and members see this")).toBeInTheDocument()
    expect(screen.getByText("Servants only")).toBeInTheDocument()
    expect(container.querySelector(".lucide-eye")).not.toBeNull()
    expect(container.querySelector(".lucide-lock-keyhole")).not.toBeNull()
  })
})
