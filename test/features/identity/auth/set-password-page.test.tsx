import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, expect, test } from "vitest"

import { apiUrl, problem } from "@test/support/api"
import { server } from "@test/support/msw"
import { navigation, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import { SetPasswordPage } from "@/features/identity/auth/set-password-page"

afterEach(() => {
  window.history.replaceState(null, "", "/")
})

type Sent = { url: string; address: string; body: unknown }

async function choose(password: string) {
  const user = userEvent.setup()
  const field = await screen.findByLabelText("New password")
  await user.clear(field)
  await user.type(field, password)
  await user.click(screen.getByRole("button", { name: "Save password" }))

  return user
}

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

test("choosing another language keeps the link usable", async () => {
  navigation.pathname = "/set-password/"
  open()
  await userEvent.click(await screen.findByRole("button", { name: "Language" }))
  await userEvent.click(screen.getByRole("menuitemradio", { name: "Deutsch" }))

  expect(router.replace).toHaveBeenCalledExactlyOnceWith("/set-password/#token=abc", {
    locale: "de",
  })

  expect(window.location.hash).toBe("")
  navigation.pathname = "/"
})

test("without a token the page is a 404 and nothing is sent", async () => {
  const sent = backend(saved)
  open("/en/set-password/")

  expect(
    await screen.findByRole("heading", { name: "This page doesn’t exist" })
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
