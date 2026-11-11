import { screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import type { ServiceReference } from "@/features/organization/services/api"
import { renderWithProviders } from "@test/support/providers"

import { ServiceSwatch, ServiceTag } from "@/components/service-tag"

describe("service colours", () => {
  test.each([
    [2, "var(--identity-2)"],
    [9, "var(--identity-1)"],
    [0, "var(--identity-1)"],
    [undefined, "var(--identity-1)"],
  ])("tone %s paints %s", (tone, colour) => {
    const { container } = renderWithProviders(<ServiceSwatch tone={tone} />)
    expect((container.firstChild as HTMLElement).style.background).toBe(colour)
  })

  test("ServiceTag takes a ServiceRef", () => {
    const service: ServiceReference = { id: "s1", name: "Sunday School", tone: 3, archived: false }
    renderWithProviders(<ServiceTag service={service} />)
    expect(screen.getByText("Sunday School")).toBeInTheDocument()
  })
})
