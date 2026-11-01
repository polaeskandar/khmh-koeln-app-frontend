import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, describe, expect, test, vi } from "vitest"

import type { Me } from "@/features/auth/api"
import { SessionProvider } from "@/features/auth/session"
import { apiUrl } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { navigation } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import { isParentActive } from "@/features/parent/parent-nav"
import { ParentNotAvailable, ParentShell } from "@/features/parent/parent-shell"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

afterEach(() => {
  navigation.pathname = "/"
})

function portal(account: Me = me.parent) {
  server.use(http.get(apiUrl("/me"), () => HttpResponse.json(account)))

  return renderWithProviders(
    <SessionProvider>
      <ParentShell>
        <p>Page</p>
      </ParentShell>
    </SessionProvider>
  )
}

describe("the parent navigation", () => {
  test.each([
    ["/parent/", "/parent/", true],
    ["/parent/", "/parent/homework/", false],
    ["/parent/homework/", "/parent/homework/", true],
    ["/parent/homework/", "/parent/homework/view/?id=x", true],
    ["/parent/homework/", "/parent/", false],
  ])("%s on %s: %s", (href, pathname, active) => {
    expect(isParentActive(href, pathname)).toBe(active)
  })

  test("both navs are labelled 'Parent portal'; the tab bar is for phones, the top nav from md", async () => {
    navigation.pathname = "/parent/homework/view/"
    portal()
    await screen.findByText("Page")
    const [top, bar] = screen.getAllByRole("navigation", { name: "Parent portal" })
    expect(top).toHaveClass("hidden", "md:flex")
    expect(bar).toHaveClass("md:hidden")

    for (const nav of [top, bar]) {
      expect(within(nav).getByRole("link", { name: /Homework/ })).toHaveAttribute(
        "aria-current",
        "page"
      )

      expect(within(nav).getByRole("link", { name: /Home$/ })).not.toHaveAttribute("aria-current")
    }
  })

  test("Home is active only on the home page", async () => {
    navigation.pathname = "/parent/"
    portal()
    await screen.findByText("Page")
    const [top] = screen.getAllByRole("navigation", { name: "Parent portal" })
    expect(within(top).getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page")
  })
})

describe("the account menu", () => {
  test.each([
    ["a parent", me.parent, false],
    ["staff with the parent role", me.staffAndParent, true],
  ])("for %s: privacy, sign out, and the staff app only for staff", async (_, account, staff) => {
    portal(account)

    await userEvent.click(
      await screen.findByRole("button", { name: `Account of ${account.account.displayName}` })
    )

    const menu = screen.getByRole("menu")
    expect(within(menu).getByText(account.account.email)).toBeInTheDocument()

    expect(within(menu).getByRole("menuitem", { name: "Privacy notice" })).toHaveAttribute(
      "href",
      "/privacy/"
    )

    expect(within(menu).getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument()
    const staffApp = within(menu).queryByRole("menuitem", { name: "Open the staff app" })
    expect(staffApp !== null).toBe(staff)

    if (staffApp) {
      expect(staffApp).toHaveAttribute("href", "/")
    }

    expect(within(menu).queryByText(/Demo|Reset|view the app as/i)).toBeNull()
  })
})

test("ParentNotAvailable says the same whatever the cause and leads to the homework", () => {
  renderWithProviders(<ParentNotAvailable />)
  expect(screen.getByText("This page isn’t available")).toBeInTheDocument()

  expect(screen.getByRole("link", { name: "See your homework" })).toHaveAttribute(
    "href",
    "/parent/homework/"
  )
})

test("no demo badge renders in the frame", async () => {
  portal()
  await screen.findByText("Page")
  expect(screen.queryByText(/Demo data/i)).toBeNull()
})
