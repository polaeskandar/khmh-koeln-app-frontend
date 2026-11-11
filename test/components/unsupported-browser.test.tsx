import { screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"

import { renderWithProviders } from "@test/support/providers"
import { UnsupportedBrowser } from "@/components/unsupported-browser"

afterEach(() => vi.unstubAllGlobals())

test.each([
  [true, 0],
  [false, 1],
])("with color-mix() supported: %s, the notice shows %i time(s)", (supported, count) => {
  vi.stubGlobal("CSS", { supports: () => supported })
  renderWithProviders(<UnsupportedBrowser />, { locale: "de" })
  expect(screen.queryAllByRole("alert")).toHaveLength(count)

  if (!supported) {
    expect(screen.getByRole("alert")).toHaveTextContent("Dieser Browser ist zu alt")
  }
})
