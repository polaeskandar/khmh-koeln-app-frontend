import { act, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeProvider } from "next-themes"
import { renderToString } from "react-dom/server"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { Toaster } from "@/components/ui/sonner"
import { renderWithProviders, testProviders } from "@test/support/providers"

import { AppearanceFields, AppearanceMenu } from "@/components/theme-switch"

const themed = (ui: React.ReactNode, defaultTheme = "system") => (
  <ThemeProvider attribute="class" defaultTheme={defaultTheme} enableSystem>
    {ui}
  </ThemeProvider>
)

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
})

afterEach(() => vi.restoreAllMocks())

test("Dark adds the dark class and stores it, Light removes it", async () => {
  renderWithProviders(themed(<AppearanceFields />))
  await userEvent.click(screen.getByRole("radio", { name: "Dark" }))
  expect(document.documentElement).toHaveClass("dark")
  expect(localStorage.getItem("theme")).toBe("dark")
  await userEvent.click(screen.getByRole("radio", { name: "Light" }))
  expect(document.documentElement).not.toHaveClass("dark")
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
  expect(document.documentElement).toHaveClass("dark")
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
