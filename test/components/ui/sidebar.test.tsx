import { screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { SidebarTrigger } from "@/components/ui/sidebar"

test("SidebarTrigger is labelled in German", () => {
  renderWithProviders(<SidebarTrigger />, { locale: "de", sidebar: true })

  expect(
    screen.getByRole("button", { name: "Seitenleiste ein- oder ausblenden" })
  ).toBeInTheDocument()
})
