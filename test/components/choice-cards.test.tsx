import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { renderWithProviders } from "@test/support/providers"
import { ChoiceCards } from "@/components/choice-cards"

const choices = [
  { value: "erasure", label: "Delete their data", hint: "Article 17" },
  { value: "copy", label: "A copy of their data" },
] as const

describe("ChoiceCards", () => {
  test("names each radio by its label and hands back the chosen value", async () => {
    const onChange = vi.fn<(value: "erasure" | "copy") => void>()

    renderWithProviders(
      <ChoiceCards value="erasure" choices={choices} onChange={onChange} aria-label="Kind" />
    )

    expect(screen.getByRole("radiogroup", { name: "Kind" })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /^Delete their data/ })).toBeChecked()
    await userEvent.click(screen.getByText("A copy of their data"))
    expect(onChange).toHaveBeenCalledWith("copy")
  })

  test("checks nothing without a value", () => {
    renderWithProviders(<ChoiceCards value={null} choices={choices} onChange={() => {}} />)

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked()
    }
  })

  test("doesn't change while disabled", async () => {
    const onChange = vi.fn()

    renderWithProviders(
      <ChoiceCards value="erasure" choices={choices} onChange={onChange} disabled />
    )

    await userEvent.click(screen.getByText("A copy of their data"))
    expect(onChange).not.toHaveBeenCalled()
  })
})
