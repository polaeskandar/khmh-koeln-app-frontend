import { screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"
import { PageHeader } from "@/components/page-header"

test("PageHeader renders the page's one h1, with the title isolated in <bdi>", () => {
  renderWithProviders(<PageHeader title="Der barmherzige Samariter?" description="Stufe 3" />)
  const headings = screen.getAllByRole("heading", { level: 1 })
  expect(headings).toHaveLength(1)
  expect(headings[0].querySelector("bdi")).toHaveTextContent("Der barmherzige Samariter?")
})
