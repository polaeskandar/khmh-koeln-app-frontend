import { screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { LinkTabs } from "@/components/link-tabs"

test("LinkTabs marks the current tab as the current page", () => {
  renderWithProviders(
    <LinkTabs
      label="Tabs"
      active="lessons"
      items={[
        { key: "overview", label: "Overview", href: "/stages/view/?id=1" },
        { key: "lessons", label: "Lessons", href: "/stages/lessons/?id=1", count: 3 },
      ]}
    />
  )

  expect(screen.getByRole("link", { name: /Lessons/ })).toHaveAttribute("aria-current", "page")
  expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current")
  expect(screen.getByRole("navigation", { name: "Tabs" })).toBeInTheDocument()
})

test("LinkTabs scroll sideways but never vertically", () => {
  renderWithProviders(
    <LinkTabs
      label="Tabs"
      active="overview"
      items={[{ key: "overview", label: "Overview", href: "/stages/view/?id=1" }]}
    />
  )

  expect(screen.getByRole("navigation", { name: "Tabs" })).toHaveClass(
    "overflow-x-auto",
    "overflow-y-hidden"
  )
})
