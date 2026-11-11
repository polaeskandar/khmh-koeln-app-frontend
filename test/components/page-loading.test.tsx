import { screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { expectVisuallyHidden } from "@test/support/layout"
import { renderWithProviders } from "@test/support/providers"
import { PageLoading } from "@/components/page-loading"

test("PageLoading is busy and says so to screen readers in German", () => {
  const { container } = renderWithProviders(<PageLoading />, { locale: "de" })
  expect(container.firstChild).toHaveAttribute("aria-busy", "true")
  expectVisuallyHidden(screen.getByText("Wird geladen …"))
})
