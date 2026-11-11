import { act, screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { MobileTabBar } from "@/features/portals/staff/mobile-tab-bar"
import { SidebarNav } from "@/features/portals/staff/sidebar-nav"
import { SessionProvider } from "@/features/identity/auth/session"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { navigation } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import { AttendanceOverviewPage } from "@/features/meetings/attendance/attendance-overview-page"

beforeEach(() => {
  navigation.pathname = "/services/"
  vi.spyOn(toast, "error")
})

afterEach(() => {
  vi.useRealTimers()
})

const overview = (openCount: number) => ({
  today: "2026-11-08",
  sessions: [],
  earlier: [],
  closed: [],
  openCount,
})

const sidebarBadge = (text: string) =>
  screen.findByText(text, { selector: "[data-sidebar='menu-badge']" })

function open(
  answer: () => Response | Promise<Response>,
  { locale = "en", page = false }: { locale?: Locale; page?: boolean } = {}
) {
  let reads = 0

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(me.servant)),
    http.get(apiUrl("/attendance/overview"), () => {
      reads++

      return answer()
    })
  )

  const { client } = renderWithProviders(
    <SessionProvider>
      <SidebarNav />
      <MobileTabBar />
      {page ? <AttendanceOverviewPage /> : null}
    </SessionProvider>,
    { locale, sidebar: true }
  )

  return { reads: () => reads, client }
}

test.each([
  ["en", "4 open"],
  ["de", "4 offen"],
  ["ar", "4 مفتوحة"],
])("in %s the sidebar shows %s", async (locale, text) => {
  open(() => HttpResponse.json(overview(4)), { locale: locale as Locale })
  const badge = await sidebarBadge(text)
  expect(badge.querySelector("[aria-hidden='true']")).not.toBeNull()
})

test("the phone's Take attendance button shows the count and is described by it", async () => {
  open(() => HttpResponse.json(overview(4)))
  const button = await screen.findByRole("link", { name: "Take attendance" })
  expect(await within(button).findByText("4")).toBeInTheDocument()
  expect(button).toHaveAccessibleDescription("4 open")
})

test.each([
  ["zero open", () => HttpResponse.json(overview(0))],
  ["an error", () => problem(500, "internal")],
  ["a pending request", () => new Promise<Response>(() => {})],
])("%s shows no badge and no toast", async (_, answer) => {
  open(answer)
  await screen.findByRole("link", { name: "Take attendance" })
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  expect(screen.queryByText(/open$/)).not.toBeInTheDocument()
  expect(toast.error).not.toHaveBeenCalled()
})

test("the badge refreshes every minute", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const page = open(() => HttpResponse.json(overview(4)))
  await sidebarBadge("4 open")
  const before = page.reads()
  await act(() => vi.advanceTimersByTimeAsync(61_000))
  expect(page.reads()).toBeGreaterThan(before)
})

test("invalidating attendance refetches the badge", async () => {
  let count = 4
  const page = open(() => HttpResponse.json(overview(count)))
  await sidebarBadge("4 open")
  count = 2
  await act(() => page.client.invalidateQueries({ queryKey: ["attendance"] }))
  expect(await sidebarBadge("2 open")).toBeInTheDocument()
})

test("on the overview page one request feeds the page and the badge", async () => {
  navigation.pathname = "/attendance/"
  const page = open(() => HttpResponse.json(overview(4)), { page: true })
  await sidebarBadge("4 open")
  expect(page.reads()).toBe(1)
})
