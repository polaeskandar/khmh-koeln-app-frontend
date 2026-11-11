import { act, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeProvider } from "next-themes"
import { renderToString } from "react-dom/server"
import { toast } from "sonner"
import { beforeEach, expect, test, vi } from "vitest"

import { Toaster } from "@/components/ui/sonner"
import { expectTheme } from "@test/support/layout"
import { renderWithProviders, testProviders } from "@test/support/providers"

import { AppearanceFields, AppearanceMenu } from "@/components/theme-switch"

const themed = (ui: React.ReactNode, defaultTheme = "system") => (
  <ThemeProvider
    attribute="class"
    defaultTheme={defaultTheme}
    enableSystem
    scriptProps={{ type: "text/plain" }}
  >
    {ui}
  </ThemeProvider>
)

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
})

test("Dark turns the page dark and stores it, Light turns it back", async () => {
  renderWithProviders(themed(<AppearanceFields />))
  await userEvent.click(screen.getByRole("radio", { name: "Dark" }))
  expectTheme("dark")
  expect(localStorage.getItem("theme")).toBe("dark")
  await userEvent.click(screen.getByRole("radio", { name: "Light" }))
  expectTheme("light")
  expect(localStorage.getItem("theme")).toBe("light")
})

test("Like the device follows the colour scheme", async () => {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }) as unknown as MediaQueryList
  )

  localStorage.setItem("theme", "light")
  renderWithProviders(themed(<AppearanceFields />))
  await userEvent.click(screen.getByRole("radio", { name: "Like the device" }))
  expect(screen.getByRole("radio", { name: "Like the device" })).toBeChecked()
  expectTheme("dark")
})

test("before mount the menu shows the device icon", () => {
  localStorage.setItem("theme", "dark")
  const { wrapper: Providers } = testProviders()
  const html = renderToString(<Providers>{themed(<AppearanceMenu />)}</Providers>)
  expect(html).toContain("lucide-monitor")
  expect(html).not.toContain("lucide-moon")
})

test("after mount the menu shows the chosen theme", async () => {
  localStorage.setItem("theme", "dark")
  renderWithProviders(themed(<AppearanceMenu />))
  const trigger = screen.getByRole("button", { name: "Appearance" })
  expect(trigger.querySelector(".lucide-moon")).not.toBeNull()
})

test("the toaster follows the resolved theme", async () => {
  renderWithProviders(themed(<Toaster />, "dark"))

  act(() => {
    toast("Saved")
  })

  const toaster = await vi.waitFor(() => {
    const element = document.querySelector("[data-sonner-toaster]")

    if (!element) {
      throw new Error("no toaster yet")
    }

    return element
  })

  expect(toaster).toHaveAttribute("data-sonner-theme", "dark")
})
