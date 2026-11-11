import { act, screen } from "@testing-library/react"
import { toast } from "sonner"
import { describe, expect, test, vi } from "vitest"

import { Providers } from "@/components/providers"
import { renderWithProviders } from "@test/support/providers"

describe("the Toaster", () => {
  test("runs right to left under Arabic and stays light on a dark device", async () => {
    vi.mocked(window.matchMedia).mockImplementation(
      (query) =>
        ({
          matches: query.includes("prefers-color-scheme: dark"),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
        }) as unknown as MediaQueryList
    )

    renderWithProviders(<Providers dir="rtl">{null}</Providers>, { locale: "ar" })

    act(() => {
      toast("مرحبا")
    })

    await screen.findByText("مرحبا")
    const toaster = document.querySelector("[data-sonner-toaster]")
    expect(toaster).toHaveAttribute("dir", "rtl")
    expect(toaster).toHaveAttribute("data-sonner-theme", "light")
  })
})
