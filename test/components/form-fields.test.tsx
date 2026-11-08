import { screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { focusFirstInvalid } from "@/components/focus-first-invalid"
import { TextAreaField, TextField } from "@/components/form-fields"
import { FormPanel } from "@/components/form-panel"

describe.each([
  ["TextField", TextField],
  ["TextAreaField", TextAreaField],
] as const)("%s", (_, Field) => {
  test("with an error, is invalid, described by the error and hides its hint", () => {
    renderWithProviders(<Field label="Name" description="As people say it" error="Enter a name." />)
    const control = screen.getByRole("textbox", { name: "Name" })
    expect(control).toHaveAttribute("aria-invalid", "true")
    expect(control).toHaveAccessibleDescription("Enter a name.")
    expect(screen.queryByText("As people say it")).toBeNull()
  })

  test("without an error, is described by its hint", () => {
    renderWithProviders(<Field label="Name" description="As people say it" />)
    const control = screen.getByRole("textbox", { name: "Name" })
    expect(control).not.toHaveAttribute("aria-invalid")
    expect(control).toHaveAccessibleDescription("As people say it")
  })

  test("an optional field says so", () => {
    renderWithProviders(<Field label="Note" optional />)
    expect(screen.getByRole("textbox", { name: "Note (optional)" })).toBeInTheDocument()
  })

  test("a supplied id keeps the label and the hint on the control", () => {
    renderWithProviders(<Field id="person-name" label="Name" description="As people say it" />)
    const control = screen.getByRole("textbox", { name: "Name" })
    expect(control).toHaveAttribute("id", "person-name")
    expect(control).toHaveAccessibleDescription("As people say it")
  })
})

test("FormPanel is a group named by its title", () => {
  renderWithProviders(
    <FormPanel title="Scripture">
      <TextField label="Passage" />
    </FormPanel>
  )

  expect(screen.getByRole("group", { name: "Scripture" })).toBeInTheDocument()
})

describe("focusFirstInvalid", () => {
  function Form({ errors }: { errors: Record<string, string> }) {
    return (
      <form data-testid="form">
        <TextField label="Title" error={errors.title} />
        <TextField label="Passage" error={errors.passage} />
        <TextAreaField label="Memory verse" error={errors.verse} />
      </form>
    )
  }

  test("focuses the first field with an error, in DOM order", () => {
    renderWithProviders(<Form errors={{ verse: "Too long.", passage: "Enter a passage." }} />)
    focusFirstInvalid(screen.getByTestId("form"))
    expect(screen.getByRole("textbox", { name: "Passage" })).toHaveFocus()
  })

  test("without errors, focus stays put", () => {
    renderWithProviders(<Form errors={{}} />)
    screen.getByRole("textbox", { name: "Title" }).focus()
    focusFirstInvalid(screen.getByTestId("form"))
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveFocus()
  })
})
