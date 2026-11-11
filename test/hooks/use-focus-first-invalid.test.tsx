import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"
import { TextAreaField, TextField } from "@/components/form-fields"
import { focusFirstInvalid, useFocusFirstInvalid } from "@/hooks/use-focus-first-invalid"

function Form({ problem }: { problem: object | null }) {
  const formRef = useFocusFirstInvalid(problem)

  return (
    <form ref={formRef}>
      <input aria-label="Name" />
      <input aria-label="Email" aria-invalid={problem ? true : undefined} />
    </form>
  )
}

test("nothing is focused while there is no problem", () => {
  render(<Form problem={null} />)

  expect(document.body).toHaveFocus()
})

test("a new problem focuses the first invalid field of the form", () => {
  const { rerender } = render(<Form problem={null} />)
  rerender(<Form problem={{ status: 422 }} />)

  expect(screen.getByLabelText("Email")).toHaveFocus()
})

test("the same problem doesn't take the focus back", () => {
  const problem = { status: 422 }
  const { rerender } = render(<Form problem={problem} />)
  screen.getByLabelText("Name").focus()
  rerender(<Form problem={problem} />)

  expect(screen.getByLabelText("Name")).toHaveFocus()
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
