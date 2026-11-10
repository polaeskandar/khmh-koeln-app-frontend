import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, describe, expect, test, vi } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import { roleSummary } from "@/features/identity/auth/role-summary"
import { SessionProvider } from "@/features/identity/auth/session"
import type { Locale } from "@/i18n/config"
import { apiUrl } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { navigation } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import { NavUser } from "@/components/app-shell/account-menu"
import { AppShell } from "@/components/app-shell/app-shell"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

afterEach(() => {
  navigation.pathname = "/"
})

function shell(account: Me, locale: Locale = "en") {
  server.use(http.get(apiUrl("/me"), () => HttpResponse.json(account)))

  return renderWithProviders(
    <SessionProvider>
      <AppShell footer={<NavUser />}>
        <p>Page</p>
      </AppShell>
    </SessionProvider>,
    { locale }
  )
}

describe("the account menu", () => {
  test.each([
    ["an administrator", me.administrator, "Administrator"],
    ["a servant who is also a parent", me.staffAndParent, "Servant +1"],
    ["the church office", me.churchOffice, "Church office"],
  ])("summarises %s as %s", async (_, account, summary) => {
    shell(account)
    expect(await screen.findByText(summary)).toBeInTheDocument()
  })

  test.each([
    ["staff and parent", me.staffAndParent, true],
    ["staff only", me.servant, false],
  ])("offers the parent portal to %s: %s", async (_, account, offered) => {
    shell(account)
    await userEvent.click(await screen.findByRole("button", { name: "Account menu" }))
    const menu = screen.getByRole("menu")

    expect(within(menu).queryByRole("menuitem", { name: "Open the parent portal" }) !== null).toBe(
      offered
    )

    if (offered) {
      expect(
        within(menu).getByRole("menuitem", { name: "Open the parent portal" })
      ).toHaveAttribute("href", "/parent/")
    }

    expect(within(menu).getByRole("menuitem", { name: "Privacy notice" })).toHaveAttribute(
      "href",
      "/privacy/"
    )
  })

  test("Sign out signs out", async () => {
    let signedOut = false

    server.use(
      http.post(apiUrl("/auth/sign-out"), () => {
        signedOut = true

        return new HttpResponse(null, { status: 204 })
      })
    )

    shell(me.servant)
    await userEvent.click(await screen.findByRole("button", { name: "Account menu" }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Sign out" }))
    await waitFor(() => expect(signedOut).toBe(true))
  })

  test("opens toward the page: to the left in Arabic", async () => {
    shell(me.servant, "ar")
    await userEvent.click(await screen.findByRole("button", { name: "قائمة الحساب" }))
    expect(screen.getByRole("menu")).toHaveAttribute("data-side", "left")
  })
})

describe("the phone's tab bar", () => {
  test("is the main navigation below md, with the raised attendance button", async () => {
    navigation.pathname = "/meetings/"
    shell(me.servant)
    const bar = await screen.findByRole("navigation", { name: "Main" })
    await within(bar).findByRole("link", { name: "Members" })
    expect(bar).toHaveClass("md:hidden")

    expect(within(bar).getByRole("link", { name: "Meetings" })).toHaveAttribute(
      "aria-current",
      "page"
    )

    expect(within(bar).getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current")

    expect(within(bar).getByRole("link", { name: "Take attendance" })).toHaveAttribute(
      "href",
      "/attendance/"
    )
  })

  test("offers Sign out under More", async () => {
    shell(me.servant)
    const bar = await screen.findByRole("navigation", { name: "Main" })
    await userEvent.click(within(bar).getByRole("button", { name: "More" }))
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Services" })).toHaveAttribute("href", "/services/")
  })

  test("leaves out Members and Take attendance without their permissions", async () => {
    shell(me.churchOffice)
    const bar = await screen.findByRole("navigation", { name: "Main" })
    expect(await within(bar).findByRole("link", { name: "Members" })).toBeInTheDocument()
    expect(within(bar).queryByRole("link", { name: "Take attendance" })).toBeNull()
  })

  test("leaves out Members without members:read", async () => {
    shell(me.attendanceOnly)
    const bar = await screen.findByRole("navigation", { name: "Main" })
    expect(await within(bar).findByRole("link", { name: "Take attendance" })).toBeInTheDocument()
    expect(within(bar).queryByRole("link", { name: "Members" })).toBeNull()
  })

  test("keeps a plain Attendance tab for accounts that only read attendance", async () => {
    shell({
      ...me.attendanceOnly,
      permissions: [{ action: "read", resource: "attendance", scope: "church" }],
    })

    const bar = await screen.findByRole("navigation", { name: "Main" })

    expect(await within(bar).findByRole("link", { name: "Attendance" })).toHaveAttribute(
      "href",
      "/attendance/"
    )

    expect(within(bar).queryByRole("link", { name: "Take attendance" })).toBeNull()
  })

  test("is absent on the attendance screen", async () => {
    navigation.pathname = "/attendance/take/"
    shell(me.servant)
    await screen.findByText("Page")
    expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull()
  })
})

test("roleSummary uses the API's role names and falls back to 'No role yet'", () => {
  expect(roleSummary(me.parent, "No role yet")).toBe("Parent")
  expect(roleSummary(me.noRoles, "No role yet")).toBe("No role yet")
})
