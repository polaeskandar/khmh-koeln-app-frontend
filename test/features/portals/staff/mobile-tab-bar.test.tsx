import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test } from "vitest"

import { me } from "@test/support/fixtures/me"
import { expectOnlyBelowMd } from "@test/support/layout"
import { navigation } from "@test/support/navigation"

import { NavUser } from "@/features/portals/staff/staff-account-menu"

import { renderStaffShell } from "@test/support/staff-shell"

describe("the phone's tab bar", () => {
  test("is the main navigation below md, with the raised attendance button", async () => {
    navigation.pathname = "/meetings/"
    renderStaffShell(me.servant, "en", <NavUser />)
    const bar = await screen.findByRole("navigation", { name: "Main" })
    await within(bar).findByRole("link", { name: "Members" })
    expectOnlyBelowMd(bar)

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
    renderStaffShell(me.servant, "en", <NavUser />)
    const bar = await screen.findByRole("navigation", { name: "Main" })
    await userEvent.click(within(bar).getByRole("button", { name: "More" }))
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Services" })).toHaveAttribute("href", "/services/")
  })

  test("leaves out Members and Take attendance without their permissions", async () => {
    renderStaffShell(me.churchOffice, "en", <NavUser />)
    const bar = await screen.findByRole("navigation", { name: "Main" })
    expect(await within(bar).findByRole("link", { name: "Members" })).toBeInTheDocument()
    expect(within(bar).queryByRole("link", { name: "Take attendance" })).toBeNull()
  })

  test("leaves out Members without members:read", async () => {
    renderStaffShell(me.attendanceOnly, "en", <NavUser />)
    const bar = await screen.findByRole("navigation", { name: "Main" })
    expect(await within(bar).findByRole("link", { name: "Take attendance" })).toBeInTheDocument()
    expect(within(bar).queryByRole("link", { name: "Members" })).toBeNull()
  })

  test("keeps a plain Attendance tab for accounts that only read attendance", async () => {
    renderStaffShell(
      {
        ...me.attendanceOnly,
        permissions: [{ action: "read", resource: "attendance", scope: "church" }],
      },
      "en",
      <NavUser />
    )

    const bar = await screen.findByRole("navigation", { name: "Main" })

    expect(await within(bar).findByRole("link", { name: "Attendance" })).toHaveAttribute(
      "href",
      "/attendance/"
    )

    expect(within(bar).queryByRole("link", { name: "Take attendance" })).toBeNull()
  })

  test("is absent on the attendance screen", async () => {
    navigation.pathname = "/attendance/take/"
    renderStaffShell(me.servant, "en", <NavUser />)
    await screen.findByText("Page")
    expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull()
  })
})
