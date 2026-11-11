import { describe, expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { MemberAvatar } from "@/components/member-avatar"

describe("MemberAvatar", () => {
  test("is hidden from screen readers, and a seed always gets the same tint", () => {
    const first = renderWithProviders(<MemberAvatar name="Mina Hanna" initials="MH" seed="p1" />)
    const avatar = first.container.querySelector("[aria-hidden='true']") as HTMLElement
    expect(avatar).not.toBeNull()
    const tint = avatar.querySelector("[data-slot='avatar-fallback']")?.className
    first.unmount()
    const second = renderWithProviders(<MemberAvatar name="Someone Else" initials="SE" seed="p1" />)
    expect(second.container.querySelector("[data-slot='avatar-fallback']")?.className).toBe(tint)
  })
})
