import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"

import { renderWithProviders } from "@test/support/providers"
import LocaleError from "@/app/[locale]/error"

vi.unmock("@/i18n/navigation")

test("the error page's button renders the screen again", async () => {
  const reset = vi.fn()
  renderWithProviders(<LocaleError error={new Error("boom")} reset={reset} />, { locale: "de" })
  await userEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }))
  expect(reset).toHaveBeenCalledOnce()
})

test("the error page says the screen couldn't be loaded, without the error's own text", () => {
  renderWithProviders(<LocaleError error={new Error("boom")} reset={vi.fn()} />, { locale: "de" })
  expect(screen.getByText("Das konnte nicht geladen werden.")).toBeInTheDocument()

  expect(
    screen.getByText("Bei uns ist etwas schiefgelaufen. Versuchen Sie es später noch einmal.")
  ).toBeInTheDocument()

  expect(screen.queryByText("boom")).toBeNull()
})
