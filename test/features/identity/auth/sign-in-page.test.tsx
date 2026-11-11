import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import { expectNoToast } from "@test/support/toasts"

import type { Me } from "@/features/identity/auth/api"
import { SessionProvider } from "@/features/identity/auth/session"
import {
  forgetOutcome,
  lastOutcome,
  rememberOutcome,
  scheduledErasureOn,
} from "@/features/identity/auth/auth-outcome"
import { PendingPage } from "@/features/identity/auth/pending-page"
import { SignInPage } from "@/features/identity/auth/sign-in-page"

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

const PASSWORD = "correct horse battery"

function backend(answer: () => Response, account: Me = me.servant) {
  let signedIn = false
  let signIns = 0

  server.use(
    http.get(apiUrl("/me"), () =>
      signedIn ? HttpResponse.json(account) : problem(401, "auth.unauthenticated")
    ),
    http.post(apiUrl("/auth/sign-in"), () => {
      signIns++
      const response = answer()

      if (response.status === 204) {
        signedIn = true
      }

      return response
    })
  )

  return () => signIns
}

const ok = () => new HttpResponse(null, { status: 204 })

async function signIn(locale: Locale = "en") {
  renderWithProviders(
    <SessionProvider>
      <SignInPage />
    </SessionProvider>,
    { locale }
  )

  await userEvent.type(await screen.findByLabelText(/Email|E-Mail|البريد/), "daniel@example.org")
  await userEvent.type(screen.getByLabelText(/^(Password|Passwort|كلمة المرور)$/), PASSWORD)
}

const submit = () => userEvent.click(screen.getByRole("button", { name: "Sign in" }))

describe("after signing in", () => {
  test.each([
    ["a servant", me.servant, "/"],
    ["a parent-only account", me.parent, "/parent/"],
  ])("%s lands on their home", async (_, account, home) => {
    backend(ok, account)
    await signIn()
    await submit()
    await waitFor(() => expect(router.replace).toHaveBeenCalledExactlyOnceWith(home))
  })

  test("a valid next opens that page in its language", async () => {
    window.history.replaceState(null, "", "/en/sign-in/?next=%2Fde%2Fmembers%2F%3Fq%3DMina")
    backend(ok)
    await signIn()
    await submit()

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledExactlyOnceWith("/members/?q=Mina", { locale: "de" })
    )
  })

  test("next=https://evil.example is ignored", async () => {
    window.history.replaceState(null, "", "/en/sign-in/?next=https%3A%2F%2Fevil.example")
    backend(ok)
    await signIn()
    await submit()
    await waitFor(() => expect(router.replace).toHaveBeenCalledExactlyOnceWith("/"))
  })
})

describe("when signing in fails", () => {
  test.each([
    [
      () => problem(401, "auth.invalidCredentials"),
      "The email address or the password is not right.",
    ],
    [
      () => problem(403, "auth.disabled"),
      "This account can no longer sign in. Ask the church office if you think this is a mistake.",
    ],
    [
      () => problem(429, "auth.tooManyAttempts", { headers: { "Retry-After": "60" } }),
      "Too many attempts. Wait a few minutes and try again.",
    ],
    [() => problem(500, "internal"), "Something went wrong on our side. Try again later."],
    [() => HttpResponse.error(), "No connection. Check your internet connection and try again."],
  ])("%#: shows its text in an alert and keeps both values", async (answer, text) => {
    backend(answer)
    await signIn()
    await submit()
    expect(await screen.findByRole("alert")).toHaveTextContent(text)
    expect(screen.getByLabelText("Email address")).toHaveValue("daniel@example.org")
    expect(screen.getByLabelText("Password")).toHaveValue(PASSWORD)
    expectNoToast()
    expect(router.replace).not.toHaveBeenCalled()
  })

  test("an address that isn't confirmed yet opens the confirm-first page", async () => {
    backend(() => problem(403, "auth.unconfirmed"))
    await signIn()
    await submit()

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledExactlyOnceWith("/sign-in/unconfirmed/")
    )
  })

  test("an account waiting for approval opens the waiting page", async () => {
    backend(() => problem(403, "auth.pending"))
    await signIn()
    await submit()
    await waitFor(() => expect(router.push).toHaveBeenCalledExactlyOnceWith("/sign-in/pending/"))
  })

  test("an account with a scheduled erasure opens the scheduled page with its date", async () => {
    backend(() => problem(403, "auth.erasureScheduled", { params: { erasesOn: "2026-11-22" } }))
    await signIn()
    await submit()

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledExactlyOnceWith("/sign-in/erasure-scheduled/")
    )

    expect(lastOutcome()).toBe("erasureScheduled")
    expect(scheduledErasureOn()).toBe("2026-11-22")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})

test("a double click sends one request, and the password goes nowhere else", async () => {
  backend(ok)
  let signIns = 0
  let answer = () => {}

  server.use(
    http.post(apiUrl("/auth/sign-in"), async () => {
      signIns++
      await new Promise<void>((resolve) => (answer = resolve))

      return problem(401, "auth.invalidCredentials")
    })
  )

  await signIn()
  await userEvent.dblClick(screen.getByRole("button", { name: "Sign in" }))
  answer()
  await screen.findByRole("alert")
  expect(signIns).toBe(1)
  expect(window.location.href).not.toContain("correct")
  expect(JSON.stringify({ ...localStorage })).not.toContain("correct")
  expect(sessionStorage.length).toBe(0)

  for (const method of ["log", "info", "warn", "error", "debug"] as const) {
    expect(JSON.stringify(vi.mocked(console[method]).mock.calls)).not.toContain("correct")
  }
})

test("the form posts, so a submit before hydration never puts the password into the URL", async () => {
  backend(ok)
  await signIn()

  expect(screen.getByRole("button", { name: "Sign in" }).closest("form")).toHaveAttribute(
    "method",
    "post"
  )
})

describe("in Arabic", () => {
  test("the inputs stay left to right and nothing promises an email or shows demo accounts", async () => {
    backend(ok)
    await signIn("ar")

    for (const input of document.querySelectorAll("input")) {
      expect(input).toHaveAttribute("dir", "ltr")
    }

    expect(document.body.textContent).not.toMatch(/البريد الإلكتروني فور|نموذج أولي|khmk-demo/)
  })
})

test("the sign-in page links to self-registration", async () => {
  backend(ok)
  await signIn()

  expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
    "href",
    "/register/"
  )
})

test("a successful sign-in forgets the last status outcome", async () => {
  rememberOutcome("pending")
  backend(ok)
  await signIn()
  await submit()

  await waitFor(() => expect(router.replace).toHaveBeenCalled())
  renderWithProviders(<PendingPage />)

  expect(screen.getByRole("heading", { name: "This page doesn’t exist" })).toBeInTheDocument()
})
