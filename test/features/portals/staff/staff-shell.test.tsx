import { screen, within } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"

import { me } from "@test/support/fixtures/me"
import { navigation } from "@test/support/navigation"
import { renderStaffShell } from "@test/support/staff-shell"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
  navigation.pathname = "/"
})

const sidebar = () => within(document.querySelector("[data-slot='sidebar']") as HTMLElement)

describe("the sidebar", () => {
  test("lists the staff areas and marks the current one", async () => {
    navigation.pathname = "/services/view/"
    renderStaffShell(me.servant)
    await sidebar().findByRole("link", { name: "Members" })

    for (const name of ["Services", "Meetings", "Attendance", "Members"]) {
      expect(sidebar().getByRole("link", { name })).toBeInTheDocument()
    }

    expect(sidebar().getByRole("link", { name: "Services" })).toHaveAttribute("data-active", "true")

    expect(sidebar().getByRole("link", { name: "Take attendance" })).toHaveAttribute(
      "href",
      "/attendance/"
    )

    expect(sidebar().getByRole("link", { name: "Attendance" })).toHaveAttribute(
      "href",
      "/attendance/"
    )
  })

  test.each([
    [
      "an administrator",
      me.administrator,
      ["Settings", "Members", "Attendance", "Take attendance"],
    ],
    ["a servant", me.servant, ["Members", "Attendance", "Take attendance"]],
    ["the church office", me.churchOffice, ["Settings", "Members"]],
    ["attendance only", me.attendanceOnly, ["Attendance", "Take attendance"]],
  ])("%s sees %s", async (_, account, shown) => {
    renderStaffShell(account)
    await sidebar().findByRole("link", { name: shown[shown.length - 1] })

    for (const name of ["Settings", "Members", "Attendance", "Take attendance"]) {
      expect(sidebar().queryByRole("link", { name }) !== null, name).toBe(shown.includes(name))
    }
  })

  test("sits on the right in Arabic", async () => {
    const { container } = renderStaffShell(me.servant, "ar")
    await screen.findByText("Page")

    expect(container.querySelector("[data-slot='sidebar'][data-side]")).toHaveAttribute(
      "data-side",
      "right"
    )
  })
})
