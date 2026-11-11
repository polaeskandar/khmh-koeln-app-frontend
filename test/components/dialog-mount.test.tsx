import { act, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useEffect, useState } from "react"
import { describe, expect, test, vi } from "vitest"

import { renderWithProviders } from "@test/support/providers"
import { DialogMount, useDialogMount } from "@/components/dialog-mount"
import { FormDialog } from "@/components/form-dialog"
import { TextField } from "@/components/form-fields"

function RenameDialog({ onClose, onUnmount }: { onClose: () => void; onUnmount: () => void }) {
  useEffect(() => onUnmount, [onUnmount])

  return (
    <FormDialog
      title="Rename the service"
      description="People see the new name straight away."
      pending={false}
      problem={null}
      submitLabel="Save"
      onSubmit={onClose}
      onClose={onClose}
    >
      <TextField label="Name" defaultValue="Choir" />
    </FormDialog>
  )
}

function RenameButton({ onUnmount = () => {} }: { onUnmount?: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}>Rename…</button>
      <DialogMount open={open}>
        <RenameDialog onClose={() => setOpen(false)} onUnmount={onUnmount} />
      </DialogMount>
    </>
  )
}

function animateDialogContent() {
  const computed = window.getComputedStyle.bind(window)

  vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudo) => {
    const style = computed(element, pseudo)

    if (!(element instanceof HTMLElement) || element.dataset.slot !== "dialog-content") {
      return style
    }

    return new Proxy(style, {
      get(target, key) {
        if (key === "animationName") {
          return element.dataset.state === "closed" ? "exit" : "enter"
        }

        const value: unknown = Reflect.get(target, key)

        return typeof value === "function" ? value.bind(target) : value
      },
    })
  })

  vi.stubGlobal("CSS", { escape: (name: string) => name })
}

function endAnimation(element: Element) {
  act(() => {
    element.dispatchEvent(Object.assign(new Event("animationend"), { animationName: "exit" }))
  })
}

describe("DialogMount", () => {
  test("keeps a closing dialog in the document until its fade has run, then unmounts its owner", async () => {
    animateDialogContent()
    const onUnmount = vi.fn()
    renderWithProviders(<RenameButton onUnmount={onUnmount} />)
    await userEvent.click(screen.getByRole("button", { name: "Rename…" }))
    const dialog = screen.getByRole("dialog", { name: "Rename the service" })
    expect(dialog).toHaveAttribute("data-state", "open")

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute("data-state", "closed")
    expect(onUnmount).not.toHaveBeenCalled()

    endAnimation(dialog)
    expect(dialog).not.toBeInTheDocument()
    await waitFor(() => expect(onUnmount).toHaveBeenCalledTimes(1))
  })

  test("without an animation, the dialog and then its owner go at once", async () => {
    const onUnmount = vi.fn()
    renderWithProviders(<RenameButton onUnmount={onUnmount} />)
    await userEvent.click(screen.getByRole("button", { name: "Rename…" }))
    await userEvent.keyboard("{Escape}")

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    await waitFor(() => expect(onUnmount).toHaveBeenCalledTimes(1))
  })

  test("every opening starts from a fresh form, also while the last one is still closing", async () => {
    animateDialogContent()
    renderWithProviders(<RenameButton />)
    await userEvent.click(screen.getByRole("button", { name: "Rename…" }))
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), " Youth")
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Choir Youth")
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))
    await userEvent.click(screen.getByRole("button", { name: "Rename…", hidden: true }))

    const dialog = await screen.findByRole("dialog", { name: "Rename the service" })
    expect(dialog).toHaveAttribute("data-state", "open")
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Choir")
  })

  test("the end of an earlier closing doesn't close a newer opening", async () => {
    const handlers: (() => void)[] = []

    function Probe() {
      const mount = useDialogMount()
      handlers.push(mount.onCloseAutoFocus)

      return <p>{mount.open ? "open" : "closing"}</p>
    }

    function Harness() {
      const [open, setOpen] = useState(true)

      return (
        <>
          <button onClick={() => setOpen(!open)}>Toggle</button>
          <DialogMount open={open}>
            <Probe />
          </DialogMount>
        </>
      )
    }

    renderWithProviders(<Harness />)
    expect(screen.getByText("open")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Toggle" }))
    expect(screen.getByText("closing")).toBeInTheDocument()
    const closedEarlier = handlers.at(-1)!
    await userEvent.click(screen.getByRole("button", { name: "Toggle" }))
    expect(screen.getByText("open")).toBeInTheDocument()

    act(() => closedEarlier())
    expect(screen.getByText("open")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Toggle" }))
    act(() => handlers.at(-1)!())
    expect(screen.queryByText(/open|closing/)).not.toBeInTheDocument()
  })
})
