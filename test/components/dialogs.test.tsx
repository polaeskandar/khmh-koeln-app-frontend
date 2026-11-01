import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { ConfirmDialog, ReasonDialog } from "@/components/confirm-dialog"

function deferred<T>() {
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>((r) => (resolve = r))

  return { promise, resolve }
}

describe("ConfirmDialog", () => {
  test("stays open with both buttons disabled while the action runs, ignoring Escape", async () => {
    const action = deferred<boolean>()

    renderWithProviders(
      <ConfirmDialog
        trigger={<button>Archive…</button>}
        title="Archive Choir?"
        confirmLabel="Archive"
        onConfirm={() => action.promise}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "Archive…" }))
    await userEvent.click(screen.getByRole("button", { name: "Archive" }))
    expect(screen.getByRole("button", { name: /Archive$/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    await userEvent.keyboard("{Escape}")
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    action.resolve(true)
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
  })

  test("stays open when the action fails", async () => {
    renderWithProviders(
      <ConfirmDialog
        trigger={<button>Delete…</button>}
        title="Delete Choir?"
        confirmLabel="Delete"
        tone="destructive"
        onConfirm={async () => false}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "Delete…" }))
    await userEvent.click(screen.getByRole("button", { name: "Delete" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled())
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })

  test("the dismiss button reads 'Abbrechen' in German by default", async () => {
    renderWithProviders(
      <ConfirmDialog
        open
        title="Archivieren?"
        confirmLabel="Archivieren"
        onConfirm={async () => true}
      />,
      { locale: "de" }
    )

    expect(screen.getByRole("button", { name: "Abbrechen" })).toBeInTheDocument()
  })
})

describe("ReasonDialog", () => {
  test("a required reason keeps confirm disabled until one is typed; it is passed trimmed", async () => {
    const onConfirm = vi.fn(async () => true)

    renderWithProviders(
      <ReasonDialog
        trigger={<button>Cancel session…</button>}
        title="Cancel this session?"
        confirmLabel="Cancel session"
        dismissLabel="Keep it"
        requireReason
        onConfirm={onConfirm}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "Cancel session…" }))
    const confirm = screen.getByRole("button", { name: "Cancel session" })
    expect(confirm).toBeDisabled()
    await userEvent.type(screen.getByRole("textbox", { name: "Reason" }), "   ")
    expect(confirm).toBeDisabled()
    await userEvent.type(screen.getByRole("textbox", { name: "Reason" }), "Bishop's visit  ")
    await userEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith("Bishop's visit")
  })

  test("an optional blank reason is null; the reason is capped at 200 characters and cleared on close", async () => {
    const onConfirm = vi.fn(async () => false)

    renderWithProviders(
      <ReasonDialog
        trigger={<button>Open</button>}
        title="Move?"
        confirmLabel="Move"
        onConfirm={onConfirm}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "Open" }))
    await userEvent.click(screen.getByRole("button", { name: "Move" }))
    expect(onConfirm).toHaveBeenLastCalledWith(null)
    const reason = screen.getByRole("textbox", { name: "Reason (optional)" })
    expect(reason).toHaveAttribute("maxLength", "200")
    await userEvent.type(reason, "Room 4 is taken")
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))
    await userEvent.click(screen.getByRole("button", { name: "Open" }))
    expect(screen.getByRole("textbox", { name: "Reason (optional)" })).toHaveValue("")
  })

  test("an optional reason is labelled 'Grund (optional)' in German", () => {
    renderWithProviders(
      <ReasonDialog
        open
        title="Verschieben?"
        confirmLabel="Verschieben"
        onConfirm={async () => true}
      />,
      { locale: "de" }
    )

    expect(screen.getByRole("textbox", { name: "Grund (optional)" })).toBeInTheDocument()
  })
})
