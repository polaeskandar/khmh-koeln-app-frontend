import { screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { expectVisuallyHidden } from "@test/support/layout"
import { renderWithProviders } from "@test/support/providers"

import { FormField, SelectField, TextAreaField, TextField } from "@/components/form-fields"

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

describe("SelectField", () => {
  function ServiceSelect({ error }: { error?: string }) {
    return (
      <SelectField label="Service" description="Where they serve" error={error} defaultValue="">
        <option value="">Choose a service</option>
        <option value="choir">Choir</option>
      </SelectField>
    )
  }

  test("is named by its label and described by its hint", () => {
    renderWithProviders(<ServiceSelect />)
    const select = screen.getByRole("combobox", { name: "Service" })
    expect(select).not.toHaveAttribute("aria-invalid")
    expect(select).toHaveAccessibleDescription("Where they serve")
  })

  test("a serviceId error is the select's description, in place of its hint", () => {
    renderWithProviders(<ServiceSelect error="Choose a service." />)
    const select = screen.getByRole("combobox", { name: "Service" })
    expect(select).toHaveAttribute("aria-invalid", "true")
    expect(select).toHaveAccessibleDescription("Choose a service.")
    expect(screen.queryByText("Where they serve")).toBeNull()
  })
})

describe("FormField", () => {
  test("links its label, hint and error to the control it renders", () => {
    renderWithProviders(
      <FormField label="Due" description="The day before the next meeting" error="Pick a day.">
        {(control) => <input type="date" {...control} />}
      </FormField>
    )

    const control = screen.getByLabelText("Due")
    expect(control).toHaveAttribute("aria-invalid", "true")
    expect(control).toHaveAccessibleDescription("Pick a day.")
  })

  test("with hideLabel, the label names the control for screen readers only", () => {
    renderWithProviders(
      <FormField label="Due date" hideLabel description="Optional">
        {(control) => <input type="date" {...control} />}
      </FormField>
    )

    const control = screen.getByLabelText("Due date")
    expectVisuallyHidden(screen.getByText("Due date"))
    expect(control).toHaveAccessibleDescription("Optional")
  })

  test("shows what sits next to the label", () => {
    renderWithProviders(
      <FormField label="Password" labelExtra={<a href="#forgot">Forgot it?</a>}>
        {(control) => <input type="password" {...control} />}
      </FormField>
    )

    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Forgot it?" })).toBeInTheDocument()
  })
})
