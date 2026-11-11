import { screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, test, vi } from "vitest"

import { navigation } from "@test/support/navigation"
import { renderWithProviders, testProviders } from "@test/support/providers"
import { TodayStamp, Topbar } from "@/features/portals/staff/topbar"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
  navigation.pathname = "/"
})

describe("the top bar", () => {
  const crumbs = [{ label: "Dienste", href: "/services/" }, { label: "Chor" }]

  test("marks the last crumb as the current page", () => {
    renderWithProviders(<Topbar crumbs={crumbs} />, { sidebar: true })

    expect(screen.getByText("Chor", { selector: "[aria-current='page']" })).toBeInTheDocument()
  })

  test("the phone's back link reads 'Zurück zu Dienste' in German", () => {
    renderWithProviders(<Topbar crumbs={crumbs} />, { locale: "de", sidebar: true })

    expect(screen.getByRole("link", { name: "Zurück zu Dienste" })).toHaveAttribute(
      "href",
      "/services/"
    )
  })

  test("TodayStamp shows Berlin's date, time and Coptic date, and nothing before mount", () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] })
    vi.setSystemTime(new Date("2026-11-08T11:08:00Z"))
    const { wrapper: Providers } = testProviders()

    expect(
      renderToString(
        <Providers>
          <TodayStamp />
        </Providers>
      )
    ).toBe("")

    renderWithProviders(<TodayStamp />)
    expect(screen.getByText("Sun 8 Nov · 12:08")).toBeInTheDocument()
    expect(screen.getByText("29 Baba 1743 A.M.")).toBeInTheDocument()
  })
})
