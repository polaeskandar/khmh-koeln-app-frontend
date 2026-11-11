import { screen } from "@testing-library/react"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { forgetOutcome, rememberOutcome } from "@/features/identity/auth/auth-outcome"
import { UnconfirmedPage } from "@/features/identity/auth/unconfirmed-page"

beforeEach(() => {
  vi.spyOn(toast, "error")

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

test("the confirm-first page explains the link and offers to register again", () => {
  rememberOutcome("unconfirmed")
  renderWithProviders(<UnconfirmedPage />)

  expect(
    screen.getByRole("heading", { name: "Confirm your email address first" })
  ).toBeInTheDocument()

  expect(
    screen.getByText("The link works for 7 days. Check your spam folder too.")
  ).toBeInTheDocument()

  expect(screen.getByRole("link", { name: "Register again" })).toHaveAttribute("href", "/register/")
  expect(screen.getByRole("link", { name: "Back to sign-in" })).toHaveAttribute("href", "/sign-in/")
})
