import { screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { OneOffBadge, SessionStatusBadge } from "@/features/meetings/meetings/session-badges"

describe("SessionStatusBadge", () => {
  test.each([
    ["scheduled", "Scheduled"],
    ["completed", "Completed"],
    ["canceled", "Canceled"],
    ["planned", "Planned"],
  ] as const)("%s shows an icon and its label", (status, label) => {
    const { container } = renderWithProviders(<SessionStatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(container.querySelector("svg")).not.toBeNull()
  })

  test("active shows the live dot, 'Anwesenheit offen' in German", () => {
    const { container } = renderWithProviders(<SessionStatusBadge status="active" />, {
      locale: "de",
    })

    expect(screen.getByText("Anwesenheit offen")).toBeInTheDocument()
    expect(container.querySelector(".animate-live")).not.toBeNull()
  })

  test("the one-off badge carries an icon too", () => {
    const { container } = renderWithProviders(<OneOffBadge />)

    expect(screen.getByText("One-off")).toBeInTheDocument()
    expect(container.querySelectorAll("svg")).toHaveLength(1)
  })
})
