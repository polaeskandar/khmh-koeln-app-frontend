import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { apiUrl, problem } from "@test/support/api"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"
import { ForgotPasswordPage } from "@/features/identity/auth/forgot-password-page"

afterEach(() => {
  window.history.replaceState(null, "", "/")
})

test("forgot-password explains how to get a link, with no form", () => {
  renderWithProviders(<ForgotPasswordPage />)
  expect(screen.getByRole("heading", { name: "Forgot your password?" })).toBeInTheDocument()
  expect(screen.getByText(/Ask the church office for a new password link/)).toBeInTheDocument()
  expect(document.querySelector("input, form")).toBeNull()
  expect(screen.getByRole("link", { name: "Back to sign-in" })).toHaveAttribute("href", "/sign-in/")
})

describe("forgot-password by email", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_RESET_BY_EMAIL", "true"))
  afterEach(() => vi.unstubAllEnvs())

  function forgot(...answers: (() => Response)[]) {
    const sent: unknown[] = []

    server.use(
      http.post(apiUrl("/auth/forgot-password"), async ({ request }) => {
        sent.push(await request.json())

        return (answers[sent.length - 1] ?? answers.at(-1)!)()
      })
    )

    renderWithProviders(<ForgotPasswordPage />)

    return sent
  }

  const accepted = () => HttpResponse.json({ status: "received" }, { status: 202 })

  async function request(address: string, click: "click" | "dblClick" = "click") {
    const user = userEvent.setup()
    const field = screen.getByLabelText("Email address")
    await user.clear(field)
    await user.type(field, address)
    await user[click](screen.getByRole("button", { name: "Send link" }))
  }

  test.each(["hoda@example.org", "nobody@example.org"])(
    "%s gets the same answer, sent once",
    async (address) => {
      const sent = forgot(accepted)
      await request(` ${address} `, "dblClick")
      const status = await screen.findByRole("status")

      expect(status).toHaveTextContent(
        `If there is an account for ${address}, we’ve sent it a link to choose a new password.`
      )

      expect(status).toHaveTextContent("The link works for one hour.")
      expect(status.querySelector('bdi[dir="ltr"]')).toHaveTextContent(address)
      expect(sent).toEqual([{ email: address }])
    }
  )

  test("an invalid address shows under the field and stays", async () => {
    forgot(() =>
      problem(422, "checkFields", {
        fieldErrors: { email: { code: "accounts.emailInvalid", params: {} } },
      })
    )

    await request("hoda@example")
    const field = screen.getByLabelText("Email address")

    await waitFor(() =>
      expect(field).toHaveAccessibleDescription("Enter an email address like name@example.org.")
    )

    expect(field).toHaveValue("hoda@example")
  })

  test("429 shows an alert and keeps the address", async () => {
    forgot(() => problem(429, "auth.tooManyAttempts"))
    await request("hoda@example.org")
    expect(await screen.findByRole("alert")).toHaveTextContent(/Too many attempts/)
    expect(screen.getByLabelText("Email address")).toHaveValue("hoda@example.org")
    expect(document.body).not.toHaveTextContent(/Prototype/)
  })

  test("in Arabic the address is typed left to right", () => {
    renderWithProviders(<ForgotPasswordPage />, { locale: "ar" })
    expect(screen.getByRole("textbox")).toHaveAttribute("dir", "ltr")
  })
})
