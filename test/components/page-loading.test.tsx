import { screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { PageLoading } from "@/components/page-loading"

test("PageLoading is busy and says so to screen readers in German", () => {
  const { container } = renderWithProviders(<PageLoading />, { locale: "de" })
  expect(container.firstChild).toHaveAttribute("aria-busy", "true")
  expect(screen.getByText("Wird geladen …")).toHaveClass("sr-only")
})
