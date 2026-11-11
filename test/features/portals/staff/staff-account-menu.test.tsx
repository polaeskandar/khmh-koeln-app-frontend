import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { describe, expect, test } from "vitest"

import { apiUrl } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { NavUser } from "@/features/portals/staff/staff-account-menu"
import { renderStaffShell } from "@test/support/staff-shell"

describe("the account menu", () => {
  test.each([
    ["an administrator", me.administrator, "Administrator"],
    ["a servant who is also a parent", me.staffAndParent, "Servant +1"],
    ["the church office", me.churchOffice, "Church office"],
  ])("summarises %s as %s", async (_, account, summary) => {
    renderStaffShell(account, "en", <NavUser />)
    expect(await screen.findByText(summary)).toBeInTheDocument()
  })

  test.each([
    ["staff and parent", me.staffAndParent, true],
    ["staff only", me.servant, false],
  ])("offers the parent portal to %s: %s", async (_, account, offered) => {
    renderStaffShell(account, "en", <NavUser />)
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

    renderStaffShell(me.servant, "en", <NavUser />)
    await userEvent.click(await screen.findByRole("button", { name: "Account menu" }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Sign out" }))
    await waitFor(() => expect(signedOut).toBe(true))
  })

  test("opens toward the page: to the left in Arabic", async () => {
    renderStaffShell(me.servant, "ar", <NavUser />)
    await userEvent.click(await screen.findByRole("button", { name: "قائمة الحساب" }))
    expect(screen.getByRole("menu")).toHaveAttribute("data-side", "left")
  })
})
