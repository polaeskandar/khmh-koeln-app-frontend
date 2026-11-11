import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, test } from "vitest"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { navigation, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import { LanguageMenu, LanguageSubmenu } from "@/components/language-switch"
import { useSwitchLocale } from "@/features/identity/auth/use-switch-locale"

function SwitchingMenu() {
  const switchLocale = useSwitchLocale()

  return <LanguageMenu onSwitch={switchLocale} />
}

beforeEach(() => {
  navigation.pathname = "/services/view/"
})

afterEach(() => {
  localStorage.clear()
  window.history.replaceState(null, "", "/")
})

describe("LanguageMenu", () => {
  test("names each language in itself and checks the current one", async () => {
    renderWithProviders(<LanguageMenu onSwitch={() => {}} />, { locale: "de" })
    await userEvent.click(screen.getByRole("button", { name: "Sprache" }))
    expect(screen.getByRole("menuitemradio", { name: "Deutsch" })).toBeChecked()
    expect(screen.getByRole("menuitemradio", { name: "العربية" })).toHaveAttribute("lang", "ar")
    expect(screen.getByRole("menuitemradio", { name: "English" })).not.toBeChecked()
  })

  test("switching keeps the page and its query, stores the choice and never reloads", async () => {
    window.history.replaceState(null, "", "/de/services/view/?id=X")
    const href = window.location.href
    renderWithProviders(<SwitchingMenu />, { locale: "de" })
    await userEvent.click(screen.getByRole("button", { name: "Sprache" }))
    await userEvent.click(screen.getByRole("menuitemradio", { name: "العربية" }))

    expect(router.replace).toHaveBeenCalledExactlyOnceWith("/services/view/?id=X", {
      locale: "ar",
    })

    expect(localStorage.getItem("khmk.locale")).toBe("ar")
    expect(window.location.href).toBe(href)
  })

  test("choosing the current language does nothing", async () => {
    renderWithProviders(<SwitchingMenu />, { locale: "en" })
    await userEvent.click(screen.getByRole("button", { name: "Language" }))
    await userEvent.click(screen.getByRole("menuitemradio", { name: "English" }))
    expect(router.replace).not.toHaveBeenCalled()
  })
})

test("LanguageSubmenu checks the current language inside an account menu", async () => {
  renderWithProviders(
    <DropdownMenu>
      <DropdownMenuTrigger>Konto</DropdownMenuTrigger>
      <DropdownMenuContent>
        <LanguageSubmenu onSwitch={() => {}} />
      </DropdownMenuContent>
    </DropdownMenu>,
    { locale: "de" }
  )

  await userEvent.click(screen.getByRole("button", { name: "Konto" }))
  await userEvent.click(screen.getByRole("menuitem", { name: /Sprache/ }))
  expect(await screen.findByRole("menuitemradio", { name: "Deutsch" })).toBeChecked()
})
