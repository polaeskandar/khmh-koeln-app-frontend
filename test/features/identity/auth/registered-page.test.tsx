import { screen } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"
import { forgetOutcome, rememberOutcome } from "@/features/identity/auth/auth-outcome"
import { RegisteredPage } from "@/features/identity/auth/registered-page"

afterEach(() => {
  forgetOutcome()
})

test("the thank-you page promises no email and links back to sign-in", () => {
  rememberOutcome("registered")
  renderWithProviders(<RegisteredPage />)
  expect(screen.getByRole("heading", { name: "Thank you for registering" })).toBeInTheDocument()

  expect(
    screen.getByText(
      "We’ve sent you an email. Open the link in it to confirm your address; only then does the church office see your registration."
    )
  ).toBeInTheDocument()

  expect(document.body).not.toHaveTextContent(/prototype/i)
  expect(screen.getByRole("link", { name: "Back to sign-in" })).toHaveAttribute("href", "/sign-in/")
})

test("the thank-you page is a 404 unless a registration just led there", () => {
  renderWithProviders(<RegisteredPage />)

  expect(screen.getByRole("heading", { name: "This page doesn’t exist" })).toBeInTheDocument()
})
