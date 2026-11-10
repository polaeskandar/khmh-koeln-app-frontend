import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { apiUrl, problem } from "@test/support/api"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import { ConfirmEmailPage } from "@/features/identity/auth/confirm-email-page"

beforeEach(() => {
  for (const method of ["error", "warn"] as const) {
    vi.spyOn(console, method).mockImplementation(() => {})
  }
})

afterEach(() => {
  window.history.replaceState(null, "", "/")
})

function backend(...answers: (() => Response)[]) {
  const sent: { body: unknown; address: string }[] = []

  server.use(
    http.post(apiUrl("/auth/email-confirmations"), async ({ request }) => {
      sent.push({ body: await request.json(), address: window.location.href })

      return (answers[sent.length - 1] ?? answers.at(-1)!)()
    })
  )

  return sent
}

const confirmed = () => new HttpResponse(null, { status: 204 })

function open(address = "/en/confirm-email/#token=abc") {
  window.history.replaceState(null, "", address)
  renderWithProviders(<ConfirmEmailPage />)
}

test("the link confirms the address once, with the token only in the body", async () => {
  const sent = backend(confirmed)
  open()

  expect(
    await screen.findByRole("heading", { name: "Your email address is confirmed" })
  ).toBeInTheDocument()

  expect(sent).toEqual([
    { body: { token: "abc" }, address: "http://localhost:3000/en/confirm-email/" },
  ])

  expect(window.location.hash).toBe("")
  expect(screen.getByRole("link", { name: "Back to sign-in" })).toHaveAttribute("href", "/sign-in/")
})

test("an invalid or expired link says so and offers to register again", async () => {
  backend(() => problem(422, "auth.confirmationLinkInvalid"))
  open()

  expect(
    await screen.findByText(
      "This confirmation link is invalid or has expired. Register again to get a new one."
    )
  ).toBeInTheDocument()

  expect(screen.getByRole("link", { name: "Register again" })).toHaveAttribute("href", "/register/")
})

test("without a token the page is a 404 and nothing is sent", async () => {
  const sent = backend(confirmed)
  open("/en/confirm-email/")

  expect(
    await screen.findByRole("heading", { name: "This page doesn’t exist" })
  ).toBeInTheDocument()

  expect(sent).toEqual([])
})

test("a refusal that isn't about the link offers Try again with the same token", async () => {
  const sent = backend(() => problem(429, "auth.tooManyAttempts"), confirmed)
  open()

  await userEvent.click(await screen.findByRole("button", { name: "Try again" }))

  expect(
    await screen.findByRole("heading", { name: "Your email address is confirmed" })
  ).toBeInTheDocument()

  await waitFor(() =>
    expect(sent.map((request) => request.body)).toEqual([{ token: "abc" }, { token: "abc" }])
  )
})
