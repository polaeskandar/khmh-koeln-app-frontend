import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import LocaleError from "@/app/[locale]/error"
import LocaleNotFound from "@/app/[locale]/not-found"

vi.unmock("@/i18n/navigation")

test("the not-found page reads in German and opens the app", () => {
  renderWithProviders(<LocaleNotFound />, { locale: "de" })
  expect(screen.getByRole("heading", { name: "Diese Seite gibt es nicht" })).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "App öffnen" })).toHaveAttribute("href", "/de")
})

test("the error page's button renders the screen again", async () => {
  const reset = vi.fn()
  renderWithProviders(<LocaleError error={new Error("boom")} reset={reset} />, { locale: "de" })
  await userEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }))
  expect(reset).toHaveBeenCalledOnce()
})
