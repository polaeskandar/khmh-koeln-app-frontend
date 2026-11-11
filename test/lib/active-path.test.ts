import { describe, expect, test } from "vitest"

import { isActive } from "@/lib/active-path"

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

  test.each([
    ["/parent/", "/parent/", "/parent/", true],
    ["/parent/", "/parent/", "/parent/homework/", false],
    ["/parent/homework/", "/parent/", "/parent/homework/", true],
    ["/parent/homework/", "/parent/", "/parent/homework/view/?id=x", true],
    ["/parent/homework/", "/parent/", "/parent/", false],
    ["/member/", "/member/", "/member/", true],
    ["/member/", "/member/", "/member/homework/", false],
    ["/member/homework/", "/member/", "/member/homework/view/?id=x", true],
    ["/member/homework/", "/member/", "/member/", false],
  ])("%s with home %s on %s: %s", (href, home, pathname, active) => {
    expect(isActive(href, pathname, home)).toBe(active)
  })
})
