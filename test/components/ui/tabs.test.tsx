import { screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

describe("orientation", () => {
  test("vertical tabs and toggle groups tell the primitives, not only the styles", () => {
    renderWithProviders(
      <>
        <Tabs orientation="vertical" defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
          </TabsList>
        </Tabs>
        <ToggleGroup type="single" orientation="vertical">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      </>
    )

    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical")
    expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute("data-orientation", "vertical")
  })
})
