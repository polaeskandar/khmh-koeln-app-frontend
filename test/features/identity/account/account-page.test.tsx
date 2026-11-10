import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { beforeEach, expect, test, vi } from "vitest"

import { NavUser } from "@/components/app-shell/account-menu"
import { SessionProvider } from "@/features/identity/auth/session"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { navigation, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import { AccountPage } from "@/features/identity/account/account-page"

let signOuts = 0

beforeEach(() => {
  navigation.pathname = "/account/"
  signOuts = 0
  vi.spyOn(toast, "success")

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(me.servant)),
    http.get(apiUrl("/me/erasure-request"), () => HttpResponse.json({ erasureRequested: null })),
    http.post(apiUrl("/auth/sign-out"), () => {
      signOuts++

      return new HttpResponse(null, { status: 204 })
    })
  )
})

function open(locale: Locale = "en") {
  renderWithProviders(
    <SessionProvider>
      <AccountPage />
    </SessionProvider>,
    { locale, sidebar: true }
  )
}

async function openDialog() {
  await userEvent.click(await screen.findByRole("button", { name: "Change password…" }))

  return within(await screen.findByRole("dialog", { name: "Change password" }))
}

test("shows the account's name, email and roles", async () => {
  open()
  const details = within(await screen.findByRole("group", { name: "Details" }))
  expect(details.getByText("Daniel Mikhail")).toBeInTheDocument()
  expect(details.getByText("daniel@example.org")).toHaveAttribute("dir", "ltr")
  expect(details.getByText("Servant")).toBeInTheDocument()

  expect(
    details.getByText("To change your name, email address or roles, ask an administrator.")
  ).toBeInTheDocument()
})

test("the account menu opens Your account", async () => {
  renderWithProviders(
    <SessionProvider>
      <NavUser />
    </SessionProvider>,
    { sidebar: true }
  )

  await userEvent.click(await screen.findByRole("button", { name: "Account menu" }))

  expect(await screen.findByRole("menuitem", { name: "Your account" })).toHaveAttribute(
    "href",
    "/account/"
  )
})

test("the language choice switches in place", async () => {
  server.use(
    http.put(apiUrl("/me/language"), () =>
      HttpResponse.json({ ...me.servant, account: { ...me.servant.account, language: "de" } })
    )
  )

  open()
  const english = await screen.findByRole("radio", { name: "English" })
  expect(english).toBeChecked()
  await userEvent.click(screen.getByRole("radio", { name: "Deutsch" }))
  expect(router.replace).toHaveBeenCalledWith("/account/", { locale: "de" })
})

test("a password change sends once, closes with a toast and reopens empty", async () => {
  const bodies: unknown[] = []

  server.use(
    http.post(apiUrl("/me/password"), async ({ request }) => {
      bodies.push(await request.json())

      return new HttpResponse(null, { status: 204 })
    })
  )

  open()
  let dialog = await openDialog()
  await userEvent.type(dialog.getByLabelText("Current password"), "old-password-1")
  await userEvent.type(dialog.getByLabelText("New password"), "new-password-12")
  await userEvent.dblClick(dialog.getByRole("button", { name: "Change password" }))
  await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("Your password is changed."))
  await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  expect(bodies).toEqual([{ currentPassword: "old-password-1", newPassword: "new-password-12" }])
  dialog = await openDialog()
  expect(dialog.getByLabelText("Current password")).toHaveValue("")
  expect(dialog.getByLabelText("New password")).toHaveValue("")
  expect(signOuts).toBe(0)
})

test.each([
  [
    "currentPassword",
    "accounts.currentPasswordWrong",
    {},
    "Current password",
    "This is not your current password.",
  ],
  [
    "newPassword",
    "accounts.passwordTooShort",
    { min: 10 },
    "New password",
    "Use at least 10 characters.",
  ],
])("a 422 on %s shows under its field and focuses it", async (field, code, params, label, text) => {
  server.use(
    http.post(apiUrl("/me/password"), () =>
      problem(422, "validation.failed", { fieldErrors: { [field]: { code, params } } })
    )
  )

  open()
  const dialog = await openDialog()
  await userEvent.type(dialog.getByLabelText("Current password"), "x")
  await userEvent.type(dialog.getByLabelText("New password"), "short")
  await userEvent.click(dialog.getByRole("button", { name: "Change password" }))
  expect(await dialog.findByText(text)).toBeInTheDocument()
  const input = dialog.getByLabelText(label)
  expect(input).toHaveAttribute("aria-invalid", "true")
  await vi.waitFor(() => expect(input).toHaveFocus())
})

test("a 429 shows an alert in the open dialog", async () => {
  server.use(http.post(apiUrl("/me/password"), () => problem(429, "auth.tooManyAttempts")))
  open()
  const dialog = await openDialog()
  await userEvent.type(dialog.getByLabelText("Current password"), "x")
  await userEvent.type(dialog.getByLabelText("New password"), "new-password-12")
  await userEvent.click(dialog.getByRole("button", { name: "Change password" }))

  expect(await dialog.findByRole("alert")).toHaveTextContent(
    "Too many attempts. Wait a few minutes and try again."
  )

  expect(screen.getByRole("dialog")).toBeInTheDocument()
})

test("Cancel closes the password dialog without a request", async () => {
  let posts = 0

  server.use(
    http.post(apiUrl("/me/password"), () => {
      posts++

      return new HttpResponse(null, { status: 204 })
    })
  )

  open()
  const dialog = await openDialog()
  await userEvent.type(dialog.getByLabelText("Current password"), "old-password-1")
  await userEvent.click(dialog.getByRole("button", { name: "Cancel" }))
  await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  expect(posts).toBe(0)
})

test("Escape doesn't close the password dialog while it saves", async () => {
  server.use(http.post(apiUrl("/me/password"), () => new Promise<Response>(() => {})))
  open()
  const dialog = await openDialog()
  await userEvent.type(dialog.getByLabelText("Current password"), "old-password-1")
  await userEvent.type(dialog.getByLabelText("New password"), "new-password-12")
  await userEvent.click(dialog.getByRole("button", { name: "Change password" }))
  await vi.waitFor(() => expect(dialog.getByRole("button", { name: "Cancel" })).toBeDisabled())
  await userEvent.keyboard("{Escape}")
  expect(screen.getByRole("dialog")).toBeInTheDocument()
})

test("in Arabic the email and password inputs stay left to right", async () => {
  open("ar")
  expect(await screen.findByText("daniel@example.org")).toHaveAttribute("dir", "ltr")
  await userEvent.click(screen.getAllByRole("button").find((b) => b.textContent?.endsWith("…"))!)
  const dialog = await screen.findByRole("dialog")

  for (const input of dialog.querySelectorAll("input")) {
    expect(input).toHaveAttribute("dir", "ltr")
  }
})
