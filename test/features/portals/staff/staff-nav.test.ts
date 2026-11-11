import { describe, expect, test } from "vitest"

import { isActive } from "@/features/portals/staff/staff-nav"

describe("isActive", () => {
  test.each([
    ["/", "/", true],
    ["/", "/services/", false],
    ["/services/", "/services/", true],
    ["/services/", "/services", true],
    ["/services", "/services/", true],
    ["/services/", "/services/view/?id=x", true],
    ["/services/", "/services/view", true],
    ["/meetings/", "/meetings-x", false],
    ["/meetings/", "/meetings-x/", false],
    ["/meetings/", "/members/", false],
    ["/services/", null, false],
  ])("%s on %s: %s", (href, pathname, active) => {
    expect(isActive(href, pathname)).toBe(active)
  })
})
