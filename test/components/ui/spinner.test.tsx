import { screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { Spinner } from "@/components/ui/spinner"

describe("Spinner", () => {
  test.each([
    ["en", "Loading"],
    ["de", "Wird geladen"],
    ["ar", "جارٍ التحميل"],
  ] as const)("Spinner is a status labelled in %s", (locale, label) => {
    renderWithProviders(<Spinner />, { locale })
    expect(screen.getByRole("status", { name: label })).toBeInTheDocument()
  })
})
