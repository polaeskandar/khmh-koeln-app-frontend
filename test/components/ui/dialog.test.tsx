import { screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

test("the dialog's close button reads 'Schließen' in German", () => {
  renderWithProviders(
    <Dialog open>
      <DialogContent>
        <DialogTitle>Titel</DialogTitle>
        <DialogDescription>Text</DialogDescription>
      </DialogContent>
    </Dialog>,
    { locale: "de" }
  )

  expect(screen.getByRole("button", { name: "Schließen" })).toBeInTheDocument()
})

test("a dialog's title keeps clear of the close button", () => {
  renderWithProviders(
    <Dialog open>
      <DialogContent>
        <DialogTitle>Record a data protection request</DialogTitle>
        <DialogDescription>Text</DialogDescription>
      </DialogContent>
    </Dialog>
  )

  expect(screen.getByRole("heading", { name: "Record a data protection request" })).toHaveClass(
    "pe-8"
  )
})
