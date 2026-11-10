import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { apiUrl, problem } from "@test/support/api"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { Registration } from "@/features/identity/auth/api"
import { forgetOutcome, rememberOutcome } from "@/features/identity/auth/auth-outcome"
import { RegisteredPage, RegisterPage } from "@/features/identity/auth/register-pages"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

const SERVICES = [
  { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f10", name: "Sunday School" },
  { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f11", name: "Youth Meeting" },
]

beforeEach(() => {
  for (const method of ["error", "warn"] as const) {
    vi.spyOn(console, method).mockImplementation(() => {})
  }
})

afterEach(() => {
  forgetOutcome()
  vi.restoreAllMocks()
  router.push.mockReset()
})

function backend(
  answer: () => Response = () => HttpResponse.json({ status: "received" }, { status: 202 })
) {
  const bodies: Registration[] = []

  server.use(
    http.get(apiUrl("/auth/register/services"), () => HttpResponse.json({ items: SERVICES })),
    http.post(apiUrl("/auth/register"), async ({ request }) => {
      bodies.push((await request.json()) as Registration)

      return answer()
    })
  )

  return bodies
}

async function fillIn(user = userEvent.setup()) {
  await user.type(screen.getByLabelText("First name"), "Mariam")
  await user.type(screen.getByLabelText("Last name"), "Hanna")
  await user.type(screen.getByLabelText("Email address"), "mariam.hanna@example.org")
  await user.type(screen.getByLabelText("Password"), "correct horse battery")
  await user.type(screen.getByLabelText("Your children"), "Youssef, 3rd Class")
  await user.click(screen.getByRole("checkbox"))

  return user
}

test("a parent's registration sends the documented body and opens the thank-you page", async () => {
  const bodies = backend()
  renderWithProviders(<RegisterPage />)
  const user = await fillIn()
  await user.click(screen.getByRole("button", { name: "Create account" }))
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/register/done/"))

  expect(bodies).toEqual([
    {
      account: {
        firstName: "Mariam",
        lastName: "Hanna",
        email: "mariam.hanna@example.org",
        password: "correct horse battery",
        language: "en",
      },
      registration: { registeredAs: "parent", note: "Youssef, 3rd Class", serviceIds: [] },
      privacy: { accepted: true, version: "2026-11" },
    },
  ])
})

test("a servant picks a service; switching back to parent drops it", async () => {
  const bodies = backend()
  renderWithProviders(<RegisterPage />)
  const user = userEvent.setup()
  expect(screen.queryByLabelText("Service")).not.toBeInTheDocument()
  await user.click(screen.getByRole("radio", { name: /Servant/ }))
  expect(screen.getByLabelText("Where do you serve?")).toBeInTheDocument()
  const select = await screen.findByRole("combobox", { name: "Service" })
  await waitFor(() => expect(select).toBeEnabled())
  expect(screen.getByRole("option", { name: "Youth Meeting" })).toBeInTheDocument()
  await user.selectOptions(select, "Youth Meeting")
  await user.click(screen.getByRole("radio", { name: /Parent/ }))
  expect(screen.queryByRole("combobox", { name: "Service" })).not.toBeInTheDocument()
  await fillIn(user)
  await user.click(screen.getByRole("button", { name: "Create account" }))
  await waitFor(() => expect(bodies).toHaveLength(1))

  expect(bodies[0].registration).toEqual({
    registeredAs: "parent",
    note: "Youssef, 3rd Class",
    serviceIds: [],
  })
})

test("a servant's registration sends the chosen service", async () => {
  const bodies = backend()
  renderWithProviders(<RegisterPage />)
  const user = userEvent.setup()
  await user.click(screen.getByRole("radio", { name: /Servant/ }))
  const select = await screen.findByRole("combobox", { name: "Service" })
  await waitFor(() => expect(select).toBeEnabled())
  await user.selectOptions(select, "Sunday School")
  await user.type(screen.getByLabelText("Where do you serve?"), "3rd Class since 2024")
  await user.click(screen.getByRole("button", { name: "Create account" }))
  await waitFor(() => expect(bodies).toHaveLength(1))

  expect(bodies[0].registration).toEqual({
    registeredAs: "servant",
    note: "3rd Class since 2024",
    serviceIds: [SERVICES[0].id],
  })
})

test("the service list offers a retry when it can't be loaded", async () => {
  let calls = 0

  server.use(
    http.get(apiUrl("/auth/register/services"), () =>
      ++calls === 1 ? problem(429, "tooManyRequests") : HttpResponse.json({ items: SERVICES })
    )
  )

  renderWithProviders(<RegisterPage />)
  const user = userEvent.setup()
  await user.click(screen.getByRole("radio", { name: /Servant/ }))
  await user.click(await screen.findByRole("button", { name: "Try again" }))
  expect(await screen.findByRole("option", { name: "Sunday School" })).toBeInTheDocument()
})

test("a 422 shows every error under its field and focuses the email", async () => {
  const bodies = backend(() =>
    problem(422, "checkFields", {
      fieldErrors: {
        "account.email": { code: "accounts.emailInvalid", params: {} },
        "account.password": { code: "accounts.passwordTooShort", params: { min: 10 } },
        "registration.note": { code: "accounts.childrenRequired", params: {} },
        "privacy.accepted": { code: "accounts.acceptPrivacy", params: {} },
      },
    })
  )

  renderWithProviders(<RegisterPage />)
  await userEvent.click(screen.getByRole("button", { name: "Create account" }))
  await waitFor(() => expect(bodies).toHaveLength(1))
  const email = screen.getByLabelText("Email address")
  await waitFor(() => expect(email).toHaveFocus())

  for (const field of [
    email,
    screen.getByLabelText("Password"),
    screen.getByLabelText("Your children"),
  ]) {
    expect(field).toHaveAttribute("aria-invalid", "true")
  }

  expect(screen.getByRole("checkbox")).toHaveAttribute("aria-invalid", "true")
  expect(document.querySelector('[data-slot="alert"]')).toBeNull()
})

test("an email that already has an account says so under the email and stays", async () => {
  const bodies = backend(() =>
    problem(422, "checkFields", {
      fieldErrors: { "account.email": { code: "accounts.emailTaken", params: {} } },
    })
  )

  renderWithProviders(<RegisterPage />)
  const user = await fillIn()
  await user.click(screen.getByRole("button", { name: "Create account" }))
  await waitFor(() => expect(bodies).toHaveLength(1))
  const email = screen.getByLabelText("Email address")
  await waitFor(() => expect(email).toHaveFocus())
  expect(email).toHaveAttribute("aria-invalid", "true")
  expect(email).toHaveValue("mariam.hanna@example.org")

  expect(
    screen.getByText(
      "There is already an account with this email address. Sign in, or reset the password if you forgot it."
    )
  ).toBeInTheDocument()

  expect(router.push).not.toHaveBeenCalled()
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in/")
})

describe.each([
  ["409", () => problem(409, "accounts.privacyNoticeOutdated"), /privacy notice has changed/],
  ["429", () => problem(429, "auth.tooManyAttempts"), /Too many attempts/],
  ["no connection", () => HttpResponse.error(), /No connection/],
])("%s", (_, answer, text) => {
  test("shows an alert and keeps every value", async () => {
    backend(answer as () => Response)
    renderWithProviders(<RegisterPage />)
    const user = await fillIn()
    await user.click(screen.getByRole("button", { name: "Create account" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(text)
    expect(screen.getByLabelText("First name")).toHaveValue("Mariam")
    expect(screen.getByLabelText("Email address")).toHaveValue("mariam.hanna@example.org")
    expect(screen.getByLabelText("Your children")).toHaveValue("Youssef, 3rd Class")
    expect(screen.getByRole("checkbox")).toBeChecked()
    expect(router.push).not.toHaveBeenCalled()
  })
})

test("a double click sends one request", async () => {
  let release: () => void = () => {}
  const bodies = backend(() => HttpResponse.json({ status: "received" }, { status: 202 }))

  server.use(
    http.post(apiUrl("/auth/register"), async ({ request }) => {
      bodies.push((await request.json()) as Registration)
      await new Promise<void>((resolve) => (release = resolve))

      return HttpResponse.json({ status: "received" }, { status: 202 })
    })
  )

  renderWithProviders(<RegisterPage />)
  const user = await fillIn()
  const submit = screen.getByRole("button", { name: "Create account" })
  await user.dblClick(submit)
  await waitFor(() => expect(bodies).toHaveLength(1))
  release()
  await waitFor(() => expect(router.push).toHaveBeenCalledOnce())
  expect(bodies).toHaveLength(1)
})

test("the privacy notice opens in a new tab", () => {
  renderWithProviders(<RegisterPage />)
  const link = screen.getByRole("link", { name: "privacy notice" })
  expect(link).toHaveAttribute("href", "/privacy/")
  expect(link).toHaveAttribute("target", "_blank")
  expect(link).toHaveAttribute("rel", "noopener")
})

test("in Arabic the email and password are typed left to right", () => {
  renderWithProviders(<RegisterPage />, { locale: "ar" })
  expect(screen.getByRole("heading", { level: 1, name: "إنشاء حساب" })).toBeInTheDocument()
  expect(screen.getByLabelText("البريد الإلكتروني")).toHaveAttribute("dir", "ltr")
  expect(document.querySelector('input[autocomplete="new-password"]')).toHaveAttribute("dir", "ltr")
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

describe("members", () => {
  test("the options are Parent, Member and Servant, in that order", () => {
    renderWithProviders(<RegisterPage />)

    expect(
      screen.getAllByRole("radio").map((radio) => radio.closest("label")?.textContent)
    ).toEqual([
      expect.stringMatching(/^Parent/),
      expect.stringMatching(/^Member/),
      expect.stringMatching(/^Servant/),
    ])

    expect(screen.getByText(/Children under 16 get an account of their own/)).toBeInTheDocument()
  })

  test("a member's registration sends their groups", async () => {
    const bodies = backend()
    renderWithProviders(<RegisterPage />)
    const user = userEvent.setup()
    await user.click(screen.getByRole("radio", { name: /Member/ }))
    await user.type(screen.getByLabelText("First name"), "Mina")
    await user.type(screen.getByLabelText("Last name"), "Hanna")
    await user.type(screen.getByLabelText("Email address"), "mina.hanna@example.org")
    await user.type(screen.getByLabelText("Password"), "correct horse battery")
    await user.type(screen.getByLabelText("Your groups"), "Youth Meeting")
    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: "Create account" }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/register/done/"))

    expect(bodies[0].registration).toEqual({
      registeredAs: "member",
      note: "Youth Meeting",
      serviceIds: [],
    })
  })

  test("a missing note shows under Your groups and takes the focus", async () => {
    backend(() =>
      problem(422, "checkFields", {
        fieldErrors: { "registration.note": { code: "accounts.groupsRequired", params: {} } },
      })
    )

    renderWithProviders(<RegisterPage />)
    await userEvent.click(screen.getByRole("radio", { name: /Member/ }))
    await userEvent.click(screen.getByRole("button", { name: "Create account" }))
    const groups = screen.getByLabelText("Your groups")
    await waitFor(() => expect(groups).toHaveFocus())
    expect(groups).toHaveAccessibleDescription(/Write which groups you take part in/)
  })
})

test("the thank-you page is a 404 unless a registration just led there", () => {
  renderWithProviders(<RegisteredPage />)

  expect(screen.getByRole("heading", { name: "This page doesn’t exist" })).toBeInTheDocument()
})
