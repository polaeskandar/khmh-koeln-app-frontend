import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { useFocusFirstInvalid } from "@/hooks/use-focus-first-invalid"

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
