import { screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { SessionProvider } from "@/features/auth/session"
import type { Locale } from "@/i18n/config"
import { apiUrl } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { navigation } from "@test/support/navigation"
import { renderWithProviders, testProviders } from "@test/support/providers"

import type { Me } from "@/features/auth/api"

import { AppShell } from "@/components/app-shell/app-shell"
import { isActive } from "@/components/app-shell/nav"
import { TodayStamp, Topbar } from "@/components/app-shell/topbar"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
  navigation.pathname = "/"
})

describe("isActive", () => {
  test.each([
    ["/", "/", true],
    ["/", "/services/", false],
    ["/services/", "/services/", true],
    ["/services/", "/services", true],
    ["/services", "/services/", true],
    ["/services/", "/services/view/?id=x", true],
    ["/services/", "/services/view", true],
    ["/meetings/", "/meetings-x", false],
    ["/meetings/", "/meetings-x/", false],
    ["/meetings/", "/members/", false],
    ["/services/", null, false],
  ])("%s on %s: %s", (href, pathname, active) => {
    expect(isActive(href, pathname)).toBe(active)
  })
})

function shell(account: Me, locale: Locale = "en") {
  server.use(http.get(apiUrl("/me"), () => HttpResponse.json(account)))

  return renderWithProviders(
    <SessionProvider>
      <AppShell>
        <p>Page</p>
      </AppShell>
    </SessionProvider>,
    { locale }
  )
}

const sidebar = () => within(document.querySelector("[data-slot='sidebar']") as HTMLElement)

describe("the sidebar", () => {
  test("lists the staff areas and marks the current one", async () => {
    navigation.pathname = "/services/view/"
    shell(me.servant)
    await sidebar().findByRole("link", { name: "Members" })

    for (const name of ["Services", "Meetings", "Attendance", "Members"]) {
      expect(sidebar().getByRole("link", { name })).toBeInTheDocument()
    }

    expect(sidebar().getByRole("link", { name: "Services" })).toHaveAttribute("data-active", "true")

    expect(sidebar().getByRole("link", { name: "Take attendance" })).toHaveAttribute(
      "href",
      "/attendance/"
    )

    expect(sidebar().getByRole("link", { name: "Attendance" })).toHaveAttribute(
      "href",
      "/attendance/"
    )
  })

  test.each([
    [
      "an administrator",
      me.administrator,
      ["Settings", "Members", "Attendance", "Take attendance"],
    ],
    ["a servant", me.servant, ["Members", "Attendance", "Take attendance"]],
    ["the church office", me.churchOffice, ["Settings", "Members"]],
    ["attendance only", me.attendanceOnly, ["Attendance", "Take attendance"]],
  ])("%s sees %s", async (_, account, shown) => {
    shell(account)
    await sidebar().findByRole("link", { name: shown[shown.length - 1] })

    for (const name of ["Settings", "Members", "Attendance", "Take attendance"]) {
      expect(sidebar().queryByRole("link", { name }) !== null, name).toBe(shown.includes(name))
    }
  })

  test("sits on the right in Arabic", async () => {
    const { container } = shell(me.servant, "ar")
    await screen.findByText("Page")

    expect(container.querySelector("[data-slot='sidebar'][data-side]")).toHaveAttribute(
      "data-side",
      "right"
    )
  })
})

describe("the top bar", () => {
  const crumbs = [{ label: "Dienste", href: "/services/" }, { label: "Chor" }]

  test("marks the last crumb as the current page", () => {
    renderWithProviders(
      <SidebarProvider>
        <Topbar crumbs={crumbs} />
      </SidebarProvider>
    )

    expect(screen.getByText("Chor", { selector: "[aria-current='page']" })).toBeInTheDocument()
  })

  test("the phone's back link reads 'Zurück zu Dienste' in German", () => {
    renderWithProviders(
      <SidebarProvider>
        <Topbar crumbs={crumbs} />
      </SidebarProvider>,
      { locale: "de" }
    )

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
