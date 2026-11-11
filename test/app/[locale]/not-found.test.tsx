import { screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"

import { renderWithProviders } from "@test/support/providers"
import LocaleNotFound from "@/app/[locale]/not-found"

vi.unmock("@/i18n/navigation")

test("the not-found page reads in German and opens the app", () => {
  renderWithProviders(<LocaleNotFound />, { locale: "de" })
  expect(screen.getByRole("heading", { name: "Diese Seite gibt es nicht" })).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "App öffnen" })).toHaveAttribute("href", "/de")
})
