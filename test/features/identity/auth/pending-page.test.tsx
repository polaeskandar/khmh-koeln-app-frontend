import { screen } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { renderWithProviders } from "@test/support/providers"
import { forgetOutcome, rememberOutcome } from "@/features/identity/auth/auth-outcome"
import { PendingPage } from "@/features/identity/auth/pending-page"
import { UnconfirmedPage } from "@/features/identity/auth/unconfirmed-page"

beforeEach(() => {
  for (const method of ["log", "info", "warn", "debug"] as const) {
    vi.spyOn(console, method).mockImplementation(() => {})
  }
})

afterEach(() => {
  forgetOutcome()
  localStorage.clear()
  sessionStorage.clear()
  window.history.replaceState(null, "", "/")
})

test("the waiting page promises no email", () => {
  rememberOutcome("pending")
  renderWithProviders(<PendingPage />)

  expect(
    screen.getByRole("heading", { name: "Your account is waiting for approval" })
  ).toBeInTheDocument()

  expect(
    screen.getByText("The church office tells you when the account is ready.")
  ).toBeInTheDocument()

  expect(screen.getByText(/links the account to their own record/)).toBeInTheDocument()
  expect(document.body.textContent).not.toMatch(/email as soon|Prototype/)
})

test.each([
  ["waiting", <PendingPage key="pending" />],
  ["confirm-first", <UnconfirmedPage key="unconfirmed" />],
])("the %s page is a 404 unless sign-in just led there", (_, page) => {
  renderWithProviders(page)

  expect(screen.getByRole("heading", { name: "This page doesn’t exist" })).toBeInTheDocument()
})

test("the waiting page is a 404 after the confirm-first outcome, and the other way round", () => {
  rememberOutcome("unconfirmed")
  renderWithProviders(<PendingPage />)

  expect(screen.getByRole("heading", { name: "This page doesn’t exist" })).toBeInTheDocument()
})
