import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, test, vi } from "vitest"

import { renderWithProviders } from "@test/support/providers"
import { FormDialog } from "@/components/form-dialog"
import { TextField } from "@/components/form-fields"

function NameDialog({
  pending = false,
  problem = null,
  submitDisabled,
  submitOnEnter,
  role,
  onSubmit = () => {},
  onClose = () => {},
}: {
  pending?: boolean
  problem?: unknown
  submitDisabled?: boolean
  submitOnEnter?: boolean
  role?: "dialog" | "alertdialog"
  onSubmit?: () => unknown
  onClose?: () => void
}) {
  return (
    <FormDialog
      title="Rename the service"
      description="People see the new name straight away."
      role={role}
      pending={pending}
      problem={problem}
      submitLabel="Save"
      submitDisabled={submitDisabled}
      submitOnEnter={submitOnEnter}
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <TextField label="Name" defaultValue="Choir" />
      <TextField label="Short name" error={problem ? "Too long." : undefined} />
    </FormDialog>
  )
}

describe("FormDialog", () => {
  test("is a dialog named by its title and described by its description", () => {
    renderWithProviders(<NameDialog />)

    const dialog = screen.getByRole("dialog", { name: "Rename the service" })
    expect(dialog).toHaveAccessibleDescription("People see the new name straight away.")
  })

  test("submits from the button and from Enter in a field", async () => {
    const onSubmit = vi.fn()
    renderWithProviders(<NameDialog onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "{Enter}")
    expect(onSubmit).toHaveBeenCalledTimes(2)
  })

  test("without submitOnEnter, only the button submits, and only when it is enabled", async () => {
    const onSubmit = vi.fn()

    const { rerender } = renderWithProviders(
      <NameDialog submitOnEnter={false} onSubmit={onSubmit} />
    )

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "{Enter}")
    await userEvent.type(screen.getByRole("textbox", { name: "Short name" }), "{Enter}")
    expect(onSubmit).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(onSubmit).toHaveBeenCalledTimes(1)

    rerender(<NameDialog submitOnEnter={false} pending onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole("button", { name: /Save/ }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  test("Cancel, Escape and the close button close it", async () => {
    const onClose = vi.fn()
    renderWithProviders(<NameDialog onClose={onClose} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))
    await userEvent.keyboard("{Escape}")
    await userEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  test("while pending, the buttons are disabled with a spinner and Escape and the close button wait", async () => {
    const onClose = vi.fn()
    const onSubmit = vi.fn()
    renderWithProviders(<NameDialog pending onSubmit={onSubmit} onClose={onClose} />)

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    const save = screen.getByRole("button", { name: /Save/ })
    expect(save).toBeDisabled()
    expect(within(save).getByRole("status")).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    await userEvent.click(screen.getByRole("button", { name: "Close" }))
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "{Enter}")
    expect(onClose).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test("a disabled submit doesn't submit from Enter either", async () => {
    const onSubmit = vi.fn()
    renderWithProviders(<NameDialog submitDisabled onSubmit={onSubmit} />)

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "{Enter}")
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test("a new problem moves focus to the first invalid field", async () => {
    function Failing() {
      const [problem, setProblem] = useState<object | null>(null)

      return <NameDialog problem={problem} onSubmit={() => setProblem({})} />
    }

    renderWithProviders(<Failing />)
    await userEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(screen.getByRole("textbox", { name: "Short name" })).toHaveFocus())
  })

  test("as an alert dialog, it is one and waits while pending", async () => {
    const onClose = vi.fn()
    renderWithProviders(<NameDialog role="alertdialog" pending onClose={onClose} />)

    expect(screen.getByRole("alertdialog", { name: "Rename the service" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    await userEvent.keyboard("{Escape}")
    expect(onClose).not.toHaveBeenCalled()
  })
})
