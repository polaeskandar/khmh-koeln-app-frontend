import { act, screen } from "@testing-library/react"
import { toast } from "sonner"
import { describe, expect, test, vi } from "vitest"

import { Providers } from "@/components/providers"
import { renderWithProviders } from "@test/support/providers"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

describe("translated screen-reader labels", () => {
  test.each([
    ["en", "Loading"],
    ["de", "Wird geladen"],
    ["ar", "جارٍ التحميل"],
  ] as const)("Spinner is a status labelled in %s", (locale, label) => {
    renderWithProviders(<Spinner />, { locale })
    expect(screen.getByRole("status", { name: label })).toBeInTheDocument()
  })

  test("the dialog's close button reads 'Schließen' in German", () => {
    renderWithProviders(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Titel</DialogTitle>
          <DialogDescription>Text</DialogDescription>
        </DialogContent>
      </Dialog>,
      { locale: "de" }
    )

    expect(screen.getByRole("button", { name: "Schließen" })).toBeInTheDocument()
  })

  test("SidebarTrigger is labelled in German", () => {
    renderWithProviders(
      <SidebarProvider>
        <SidebarTrigger />
      </SidebarProvider>,
      { locale: "de" }
    )

    expect(
      screen.getByRole("button", { name: "Seitenleiste ein- oder ausblenden" })
    ).toBeInTheDocument()
  })
})

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

test("a dialog's title keeps clear of the close button", () => {
  renderWithProviders(
    <Dialog open>
      <DialogContent>
        <DialogTitle>Record a data protection request</DialogTitle>
        <DialogDescription>Text</DialogDescription>
      </DialogContent>
    </Dialog>
  )

  expect(screen.getByRole("heading", { name: "Record a data protection request" })).toHaveClass(
    "pe-8"
  )
})
