import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { describe, expect, test } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import { SessionProvider } from "@/features/identity/auth/session"
import { apiUrl } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { navigation } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { ChildSummary } from "@/features/people/children/api"
import { ParentNotAvailable, ParentShell } from "@/features/portals/parent/parent-shell"

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

function serveChildren(items: ChildSummary[]) {
  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(me.parent)),
    http.get(apiUrl("/parent/children"), () => HttpResponse.json({ today: "2026-11-08", items }))
  )
}

test("the tab bar shows Home, My children, Homework and Account", async () => {
  navigation.pathname = "/parent/children/"
  serveChildren([])

  renderWithProviders(
    <SessionProvider>
      <ParentShell>
        <p>Page</p>
      </ParentShell>
    </SessionProvider>
  )

  const navs = await screen.findAllByRole("navigation", { name: "Parent portal" })

  for (const nav of navs) {
    const links = within(nav).getAllByRole("link")
    expect(links.map((l) => l.textContent)).toEqual(["Home", "My children", "Homework", "Account"])

    expect(within(nav).getByRole("link", { name: "My children" })).toHaveAttribute(
      "aria-current",
      "page"
    )
  }
})
