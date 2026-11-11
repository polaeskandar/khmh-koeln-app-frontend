import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { NameDescriptionDialog } from "@/components/name-description-dialog"

const texts = {
  name: "Name",
  namePlaceholder: "Choir",
  description: "Description",
  descriptionPlaceholder: "What it is about",
}

function renderDialog({
  saved,
  problem = null,
  fieldErrors = {},
  problemShown = "toast",
}: {
  saved?: { name: string; description: string | null }
  problem?: { message: string } | null
  fieldErrors?: Record<string, string>
  problemShown?: "toast" | "inline"
} = {}) {
  const execute = vi.fn(async () => {})
  const onClose = vi.fn()

  renderWithProviders(
    <NameDescriptionDialog
      saved={saved}
      title="Edit"
      description="Name and description"
      submitLabel="Save"
      texts={texts}
      limits={{ name: 80, description: 500, descriptionRows: 2 }}
      mutation={{ pending: false, problem, fieldErrors, execute }}
      problemShown={problemShown}
      onClose={onClose}
    />
  )

  return { execute, onClose }
}

describe("NameDescriptionDialog", () => {
  test("sends the typed name and a blank description as null", async () => {
    const { execute } = renderDialog()

    await userEvent.type(screen.getByLabelText("Name"), "Choir")
    await userEvent.type(screen.getByLabelText("Description (optional)"), "   ")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))

    expect(execute).toHaveBeenCalledWith({ name: "Choir", description: null })
  })

  test("closes without sending when the saved values are unchanged", async () => {
    const { execute, onClose } = renderDialog({ saved: { name: "Choir", description: null } })

    expect(screen.getByLabelText("Name")).toHaveValue("Choir")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))

    expect(onClose).toHaveBeenCalled()
    expect(execute).not.toHaveBeenCalled()
  })

  test("sends both fields when one of the saved values changed", async () => {
    const { execute, onClose } = renderDialog({ saved: { name: "Choir", description: "Hymns" } })

    await userEvent.type(screen.getByLabelText("Name"), "s")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))

    expect(execute).toHaveBeenCalledWith({ name: "Choirs", description: "Hymns" })
    expect(onClose).not.toHaveBeenCalled()
  })

  test("shows a problem above the fields only when it is shown inline", () => {
    renderDialog({ problem: { message: "The service is archived." }, problemShown: "inline" })
    expect(screen.getByRole("alert")).toHaveTextContent("The service is archived.")
  })

  test("leaves a problem to the toast when it is not shown inline", () => {
    renderDialog({ problem: { message: "The service is archived." } })
    expect(screen.queryByRole("alert")).toBeNull()
  })

  test("shows field errors under their fields rather than above them", () => {
    renderDialog({
      problem: { message: "Check the fields." },
      fieldErrors: { name: "Too long." },
      problemShown: "inline",
    })

    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription("Too long.")
    expect(screen.queryByText("Check the fields.")).toBeNull()
  })
})
