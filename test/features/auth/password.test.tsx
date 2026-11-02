import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { apiUrl, problem } from "@test/support/api"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import { ForgotPasswordPage, SetPasswordPage } from "@/features/auth/password-pages"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

type Sent = { url: string; address: string; body: unknown }

beforeEach(() => {
  for (const method of ["error", "warn"] as const) {
    vi.spyOn(console, method).mockImplementation(() => {})
  }
})

afterEach(() => {
  vi.restoreAllMocks()
  window.history.replaceState(null, "", "/")
})

function backend(...answers: (() => Response)[]) {
  const sent: Sent[] = []

  server.use(
    http.post(apiUrl("/auth/password-links"), async ({ request }) => {
      sent.push({ url: request.url, address: window.location.href, body: await request.json() })

      return (answers[sent.length - 1] ?? answers.at(-1)!)()
    })
  )

  return sent
}

const saved = () => new HttpResponse(null, { status: 204 })

function open(address = "/en/set-password/#token=abc", locale: "en" | "ar" = "en") {
  window.history.replaceState(null, "", address)
  renderWithProviders(<SetPasswordPage />, { locale })
}

async function choose(password: string) {
  const user = userEvent.setup()
  const field = await screen.findByLabelText("New password")
  await user.clear(field)
  await user.type(field, password)
  await user.click(screen.getByRole("button", { name: "Save password" }))

  return user
}

test("the token leaves the address before any request and travels only in the body", async () => {
  const sent = backend(saved)
  open()
  await screen.findByLabelText("New password")
  expect(window.location.href).toBe("http://localhost:3000/en/set-password/")
  await choose("correct horse battery")
  expect(await screen.findByRole("heading", { name: "Your password is saved" })).toBeInTheDocument()

  expect(sent).toEqual([
    {
      url: apiUrl("/auth/password-links"),
      address: "http://localhost:3000/en/set-password/",
      body: { token: "abc", password: "correct horse battery" },
    },
  ])

  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in/")
})

test("without a token the link is invalid and nothing is sent", async () => {
  const sent = backend(saved)
  open("/en/set-password/")

  expect(
    await screen.findByText("This link no longer works; ask the church office for a new one.")
  ).toBeInTheDocument()

  expect(screen.queryByLabelText("New password")).not.toBeInTheDocument()
  expect(sent).toEqual([])
})

test("a used or expired link shows the same state", async () => {
  backend(() => problem(422, "auth.resetLinkInvalid"))
  open()
  await choose("correct horse battery")

  expect(
    await screen.findByText("This link no longer works; ask the church office for a new one.")
  ).toBeInTheDocument()

  expect(screen.getByRole("link", { name: "Back to sign-in" })).toHaveAttribute("href", "/sign-in/")
})

test("a short password shows under the field, and a longer one succeeds", async () => {
  const sent = backend(
    () =>
      problem(422, "checkFields", {
        fieldErrors: { password: { code: "accounts.passwordTooShort", params: { min: 10 } } },
      }),
    saved
  )

  open()
  await choose("short")
  const field = screen.getByLabelText("New password")
  await waitFor(() => expect(field).toHaveAccessibleDescription("Use at least 10 characters."))
  expect(document.querySelector('[data-slot="alert"]')).toBeNull()
  await choose("correct horse battery")
  expect(await screen.findByRole("heading", { name: "Your password is saved" })).toBeInTheDocument()

  expect(sent.map((request) => (request.body as { password: string }).password)).toEqual([
    "short",
    "correct horse battery",
  ])
})

test("429 shows an alert", async () => {
  backend(() => problem(429, "auth.tooManyAttempts"))
  open()
  await choose("correct horse battery")
  expect(await screen.findByRole("alert")).toHaveTextContent(/Too many attempts/)
  expect(screen.getByLabelText("New password")).toHaveValue("correct horse battery")
})

test("a double submit sends one request", async () => {
  let release: () => void = () => {}
  const sent: unknown[] = []

  server.use(
    http.post(apiUrl("/auth/password-links"), async ({ request }) => {
      sent.push(await request.json())
      await new Promise<void>((resolve) => (release = resolve))

      return saved()
    })
  )

  open()
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText("New password"), "correct horse battery")
  await user.dblClick(screen.getByRole("button", { name: "Save password" }))
  await waitFor(() => expect(sent).toHaveLength(1))
  release()
  expect(await screen.findByRole("heading", { name: "Your password is saved" })).toBeInTheDocument()
  expect(sent).toHaveLength(1)
})

test("in Arabic the password is typed left to right", async () => {
  backend(saved)
  open("/ar/set-password/#token=abc", "ar")
  expect(await screen.findByLabelText("كلمة المرور الجديدة")).toHaveAttribute("dir", "ltr")
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
