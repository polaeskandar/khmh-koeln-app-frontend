import { screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { RosterCells } from "@/features/meetings/attendance/roster-cells"

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
