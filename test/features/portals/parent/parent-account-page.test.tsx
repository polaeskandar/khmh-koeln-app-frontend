import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { describe, expect, test, vi } from "vitest"

import { SessionProvider } from "@/features/identity/auth/session"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { mimi, mina } from "@test/support/fixtures/parent"
import { server } from "@test/support/msw"
import { navigation, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import { expectToast } from "@test/support/toasts"

import type { ChildSummary } from "@/features/people/children/api"
import { ParentAccountPage } from "@/features/portals/parent/parent-account-page"

const mariam = { ...mimi, fullName: "Mariam Hanna", name: "Mariam" }

const minaHanna = { ...mina, fullName: "Mina Hanna", toDo: 1, done: 2 }

function serve(items: ChildSummary[]) {
  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(me.parent)),
    http.get(apiUrl("/parent/children"), () => HttpResponse.json({ today: "2026-11-08", items }))
  )
}

describe("Account", () => {
  function open(items: ChildSummary[], locale: Locale = "en") {
    navigation.pathname = "/parent/account/"
    serve(items)

    server.use(
      http.get(apiUrl("/me/erasure-request"), () => HttpResponse.json({ erasureRequested: null }))
    )

    renderWithProviders(
      <SessionProvider>
        <ParentAccountPage />
      </SessionProvider>,
      { locale }
    )
  }

  test("lists the details and the children's full names", async () => {
    open([mariam, minaHanna])
    expect(await screen.findByText("Mariam Hanna, Mina Hanna")).toBeInTheDocument()
    expect(screen.getByText(me.parent.account.email)).toHaveAttribute("dir", "ltr")
    expect(screen.getByText("What the church sees")).toBeInTheDocument()
  })

  test("joins the names the Arabic way", async () => {
    open([mariam, minaHanna], "ar")
    expect(await screen.findByText("Mariam Hanna، Mina Hanna")).toBeInTheDocument()
  })

  test("says none is linked without children", async () => {
    open([])
    expect(await screen.findByText("None linked yet")).toBeInTheDocument()
  })

  test("children that fail to load say so with a retry", async () => {
    open([mariam])
    server.use(http.get(apiUrl("/parent/children"), () => problem(403, "forbidden")))
    expect(await screen.findByText("This couldn’t be loaded.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
  })

  test("Deutsch switches the language in place", async () => {
    server.use(
      http.put(apiUrl("/me/language"), () =>
        HttpResponse.json({ ...me.parent, account: { ...me.parent.account, language: "de" } })
      )
    )

    open([mina])
    expect(await screen.findByRole("radio", { name: "English" })).toBeChecked()
    await userEvent.click(screen.getByRole("radio", { name: "Deutsch" }))
    expect(router.replace).toHaveBeenCalledWith("/parent/account/", { locale: "de" })
  })

  test("the password change shows a wrong current password, then closes after 204", async () => {
    let attempts = 0

    server.use(
      http.post(apiUrl("/me/password"), () =>
        ++attempts === 1
          ? problem(422, "validation.failed", {
              fieldErrors: {
                currentPassword: { code: "accounts.currentPasswordWrong", params: {} },
              },
            })
          : new HttpResponse(null, { status: 204 })
      )
    )

    open([mina])
    await userEvent.click(await screen.findByRole("button", { name: "Change password…" }))
    const dialog = within(await screen.findByRole("dialog"))
    await userEvent.type(dialog.getByLabelText("Current password"), "wrong-password")
    await userEvent.type(dialog.getByLabelText("New password"), "new-password-12")
    await userEvent.click(dialog.getByRole("button", { name: "Change password" }))
    expect(await dialog.findByText("This is not your current password.")).toBeInTheDocument()
    await userEvent.click(dialog.getByRole("button", { name: "Change password" }))
    await expectToast("Your password is changed.")
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByText("Mina Farag")).toBeInTheDocument()
  })
})
