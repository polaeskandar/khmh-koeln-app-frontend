import { screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { HomeworkStatusBadge } from "@/features/learning/homework/homework-status-badge"

describe("HomeworkStatusBadge", () => {
  test.each([
    ["draft", "Draft"],
    ["published", "Published"],
    ["archived", "Archived"],
  ] as const)("homework %s shows an icon and %s", (status, label) => {
    const { container } = renderWithProviders(<HomeworkStatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(container.querySelector("svg")).not.toBeNull()
  })
})
