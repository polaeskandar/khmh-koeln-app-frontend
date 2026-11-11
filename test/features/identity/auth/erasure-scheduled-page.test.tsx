import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, expect, test } from "vitest"

import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"
import { expectNoToast } from "@test/support/toasts"

import {
  forgetOutcome,
  rememberErasureScheduled,
  rememberOutcome,
} from "@/features/identity/auth/auth-outcome"
import { ErasureScheduledPage } from "@/features/identity/auth/erasure-scheduled-page"

const PASSWORD = "correct horse battery"

afterEach(() => {
  forgetOutcome()
})

function backend(...answers: (() => Response)[]) {
  const sent: unknown[] = []

  server.use(
    http.post(apiUrl("/auth/erasure-cancellation"), async ({ request }) => {
      sent.push(await request.json())

      return (answers[sent.length - 1] ?? answers.at(-1)!)()
    })
  )

  return sent
}

const canceled = () => new HttpResponse(null, { status: 204 })

function open(locale: Locale = "en") {
  rememberErasureScheduled("2026-11-22")
  renderWithProviders(<ErasureScheduledPage />, { locale })
}

async function cancelWith(email: string, password: string) {
  await userEvent.type(screen.getByLabelText("Email address"), email)
  await userEvent.type(screen.getByLabelText("Password"), password)
  await userEvent.click(screen.getByRole("button", { name: "Cancel the erasure" }))
}

test("says when the account is deleted and how to cancel", () => {
  open()

  expect(
    screen.getByRole("heading", { name: "Your account will be deleted", level: 1 })
  ).toBeInTheDocument()

  expect(
    screen.getByText(
      "You asked for your account and data to be deleted. The account is locked, and everything is deleted on Sunday 22 November 2026."
    )
  ).toBeInTheDocument()

  expect(screen.getByRole("heading", { name: "Changed your mind?" })).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "Back to sign-in" })).toHaveAttribute("href", "/sign-in/")

  expect(screen.getByRole("link", { name: "Forgot your password?" })).toHaveAttribute(
    "href",
    "/forgot-password/"
  )
})

test("cancelling sends the email and password, then says the account is back", async () => {
  const sent = backend(canceled)
  open()
  await cancelWith("  daniel@example.org ", PASSWORD)

  expect(
    await screen.findByRole("heading", { name: "Your account is back", level: 1 })
  ).toBeInTheDocument()

  expect(screen.getByRole("status")).toHaveTextContent(
    "The erasure is canceled and nothing was deleted. Sign in as usual."
  )

  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in/")
  expect(sent).toEqual([{ email: "daniel@example.org", password: PASSWORD }])
  expectNoToast()
})

test.each([
  [
    "wrong credentials",
    () => problem(401, "auth.invalidCredentials"),
    "The email address or the password is not right.",
  ],
  [
    "nothing scheduled",
    () => problem(409, "privacy.nothingScheduled"),
    "Nothing is waiting to be deleted for this account.",
  ],
  [
    "too many attempts",
    () => problem(429, "auth.tooManyAttempts", { headers: { "Retry-After": "60" } }),
    "Too many attempts. Wait a few minutes and try again.",
  ],
  [
    "no connection",
    () => HttpResponse.error(),
    "No connection. Check your internet connection and try again.",
  ],
])("%s shows its text in an alert and keeps both values", async (_, answer, text) => {
  backend(answer)
  open()
  await cancelWith("daniel@example.org", PASSWORD)
  expect(await screen.findByRole("alert")).toHaveTextContent(text)
  expect(screen.getByLabelText("Email address")).toHaveValue("daniel@example.org")
  expect(screen.getByLabelText("Password")).toHaveValue(PASSWORD)
  expect(screen.queryByRole("heading", { name: "Your account is back" })).not.toBeInTheDocument()
  expectNoToast()
})

test("a second try after a wrong password succeeds", async () => {
  const sent = backend(() => problem(401, "auth.invalidCredentials"), canceled)
  open()
  await cancelWith("daniel@example.org", "wrong horse")
  await screen.findByRole("alert")
  await userEvent.clear(screen.getByLabelText("Password"))
  await userEvent.type(screen.getByLabelText("Password"), PASSWORD)
  await userEvent.click(screen.getByRole("button", { name: "Cancel the erasure" }))
  expect(await screen.findByRole("heading", { name: "Your account is back" })).toBeInTheDocument()
  expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  expect(sent).toHaveLength(2)
})

test("a double click sends one cancellation", async () => {
  let answer = () => {}
  let sent = 0

  server.use(
    http.post(apiUrl("/auth/erasure-cancellation"), async () => {
      sent++
      await new Promise<void>((resolve) => (answer = resolve))

      return canceled()
    })
  )

  open()
  await userEvent.type(screen.getByLabelText("Email address"), "daniel@example.org")
  await userEvent.type(screen.getByLabelText("Password"), PASSWORD)
  await userEvent.dblClick(screen.getByRole("button", { name: "Cancel the erasure" }))
  answer()
  await screen.findByRole("heading", { name: "Your account is back" })
  expect(sent).toBe(1)
})

test("the form posts, so a submit before hydration never puts the password into the URL", () => {
  open()

  expect(
    screen.getByRole("button", { name: "Cancel the erasure" }).closest("form")
  ).toHaveAttribute("method", "post")
})

test("is a 404 unless sign-in or the erasure request just led there", () => {
  renderWithProviders(<ErasureScheduledPage />)
  expect(screen.getByRole("heading", { name: "This page doesn’t exist" })).toBeInTheDocument()
})

test("is a 404 after another sign-in outcome", () => {
  rememberOutcome("pending")
  renderWithProviders(<ErasureScheduledPage />)
  expect(screen.getByRole("heading", { name: "This page doesn’t exist" })).toBeInTheDocument()
})

test("reads in Arabic with the inputs left to right", () => {
  open("ar")
  expect(screen.getByRole("heading", { name: "سيتم حذف حسابك", level: 1 })).toBeInTheDocument()
  expect(screen.getByText(/وسيُحذف كل شيء يوم/)).toBeInTheDocument()

  for (const input of document.querySelectorAll("input")) {
    expect(input).toHaveAttribute("dir", "ltr")
  }
})

test("reads in German", async () => {
  backend(canceled)
  open("de")

  expect(
    screen.getByText(/alles wird am Sonntag, 22\. November 2026 gelöscht\./)
  ).toBeInTheDocument()

  await userEvent.type(screen.getByLabelText("E-Mail-Adresse"), "daniel@example.org")
  await userEvent.type(screen.getByLabelText("Passwort"), PASSWORD)
  await userEvent.click(screen.getByRole("button", { name: "Löschung widerrufen" }))

  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Ihr Konto ist wieder da" })).toBeInTheDocument()
  )
})
