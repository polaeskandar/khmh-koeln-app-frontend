import { screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"
import { TextField } from "@/components/form-fields"
import { FormPanel } from "@/components/form-panel"

test("FormPanel is a group named by its title", () => {
  renderWithProviders(
    <FormPanel title="Scripture">
      <TextField label="Passage" />
    </FormPanel>
  )

  expect(screen.getByRole("group", { name: "Scripture" })).toBeInTheDocument()
})
