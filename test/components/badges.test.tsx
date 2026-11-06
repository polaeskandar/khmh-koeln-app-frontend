import { screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import type { ServiceRef } from "@/lib/api/types/common"
import { renderWithProviders } from "@test/support/providers"

import { MemberAvatar } from "@/components/member-avatar"
import { RosterCells } from "@/components/roster-cells"
import { ServiceSwatch, ServiceTag } from "@/components/service-tag"
import { MovedBadge, OneOffBadge, SessionStatusBadge } from "@/components/status"

describe("SessionStatusBadge", () => {
  test.each([
    ["scheduled", "Scheduled"],
    ["completed", "Completed"],
    ["canceled", "Canceled"],
    ["planned", "Planned"],
  ] as const)("%s shows an icon and its label", (status, label) => {
    const { container } = renderWithProviders(<SessionStatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(container.querySelector("svg")).not.toBeNull()
  })

  test("active shows the live dot, 'Anwesenheit offen' in German", () => {
    const { container } = renderWithProviders(<SessionStatusBadge status="active" />, {
      locale: "de",
    })

    expect(screen.getByText("Anwesenheit offen")).toBeInTheDocument()
    expect(container.querySelector(".animate-live")).not.toBeNull()
  })

  test("moved and one-off badges carry an icon too", () => {
    const { container } = renderWithProviders(
      <>
        <MovedBadge />
        <OneOffBadge />
      </>
    )

    expect(screen.getByText("Moved")).toBeInTheDocument()
    expect(screen.getByText("One-off")).toBeInTheDocument()
    expect(container.querySelectorAll("svg")).toHaveLength(2)
  })
})

describe("RosterCells", () => {
  test("9 of 14 reads as such and draws 14 squares", () => {
    const { container } = renderWithProviders(<RosterCells filled={9} total={14} />)
    const cells = screen.getByRole("img", { name: "9 of 14 present" })
    expect(cells).toBeInTheDocument()
    expect(container.querySelectorAll("[role='img'] > *")).toHaveLength(14)
  })

  test("3 extra add their squares and say so", () => {
    const { container } = renderWithProviders(<RosterCells filled={9} total={14} extra={3} />)

    expect(
      screen.getByRole("img", { name: "9 of 14 present, plus 3 not on the roster" })
    ).toBeInTheDocument()

    expect(container.querySelectorAll("[role='img'] > *")).toHaveLength(17)
  })

  test("0 of 0 renders nothing", () => {
    const { container } = renderWithProviders(<RosterCells filled={0} total={0} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe("service colours", () => {
  test.each([
    [2, "var(--identity-2)"],
    [9, "var(--identity-1)"],
    [0, "var(--identity-1)"],
    [undefined, "var(--identity-1)"],
  ])("tone %s paints %s", (tone, colour) => {
    const { container } = renderWithProviders(<ServiceSwatch tone={tone} />)
    expect((container.firstChild as HTMLElement).style.background).toBe(colour)
  })

  test("ServiceTag takes a ServiceRef", () => {
    const service: ServiceRef = { id: "s1", name: "Sunday School", tone: 3, archived: false }
    renderWithProviders(<ServiceTag service={service} />)
    expect(screen.getByText("Sunday School")).toBeInTheDocument()
  })
})

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
