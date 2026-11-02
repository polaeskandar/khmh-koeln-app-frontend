import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { SessionProvider } from "@/features/auth/session"
import { ParentAccount } from "@/features/parent/parent-account"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import { AccountPage } from "@/features/account/account-page"
import { OwnData } from "@/features/account/own-data"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

const requested = { receivedAt: "2026-11-08T11:08:00Z", dueOn: "2026-12-08" }
let clicks: { href: string; download: string }[] = []

beforeEach(() => {
  clicks = []
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
  URL.createObjectURL = vi.fn(() => "blob:khmk-my-data")
  URL.revokeObjectURL = vi.fn()

  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    clicks.push({ href: this.href, download: this.download })
  })
})

afterEach(() => vi.restoreAllMocks())

function open(
  erasure: () => Record<string, unknown> = () => ({ erasureRequested: null }),
  locale: Locale = "en"
) {
  let reads = 0

  server.use(
    http.get(apiUrl("/me/erasure-request"), () => {
      reads++

      return HttpResponse.json(erasure())
    })
  )

  renderWithProviders(<OwnData today="2026-11-08" />, { locale })

  return { reads: () => reads }
}

test("downloads the data with the session cookie and frees the file", async () => {
  const fetches = vi.spyOn(globalThis, "fetch")

  server.use(
    http.get(apiUrl("/me/personal-data"), () =>
      HttpResponse.json({ account: { email: "daniel@example.org" } })
    )
  )

  open()
  await userEvent.click(await screen.findByRole("button", { name: "Download (JSON)" }))
  await vi.waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:khmk-my-data"))
  expect(clicks).toEqual([{ href: "blob:khmk-my-data", download: "khmk-my-data.json" }])

  const request = fetches.mock.calls
    .map(([input]) => input)
    .find(
      (input): input is Request =>
        input instanceof Request && input.url.endsWith("/me/personal-data")
    )

  expect(request?.credentials).toBe("include")
})

test("a failed download toasts and saves nothing", async () => {
  server.use(http.get(apiUrl("/me/personal-data"), () => problem(500, "internal")))
  open()
  await userEvent.click(await screen.findByRole("button", { name: "Download (JSON)" }))
  await vi.waitFor(() => expect(toast.error).toHaveBeenCalled())
  expect(clicks).toEqual([])
  expect(URL.createObjectURL).not.toHaveBeenCalled()
})

test.each([
  [
    "with a note",
    "Please delete my children’s data too.",
    { note: "Please delete my children’s data too." },
  ],
  ["without a note", "", {}],
])("asking to delete %s sends it, then shows the request", async (_, note, body) => {
  const posted: unknown[] = []

  server.use(
    http.post(apiUrl("/me/erasure-request"), async ({ request }) => {
      posted.push(await request.json())

      return HttpResponse.json(requested, { status: 201 })
    })
  )

  open()
  await userEvent.click(await screen.findByRole("button", { name: "Ask to delete…" }))
  const dialog = within(await screen.findByRole("alertdialog"))

  if (note) {
    await userEvent.type(dialog.getByRole("textbox"), note)
  }

  await userEvent.click(dialog.getByRole("button", { name: "Send request" }))

  expect(await screen.findByRole("status")).toHaveTextContent(
    "You asked today at 12:08 for your account and data to be deleted. The church office will answer by Tue 8 Dec 2026."
  )

  expect(posted).toEqual([body])

  expect(toast.success).toHaveBeenCalledWith(
    "Your request was sent to the church office. It will answer within one month."
  )

  expect(screen.queryByRole("button", { name: "Ask to delete…" })).not.toBeInTheDocument()
})

test("an open request shows on load without the button", async () => {
  open(() => ({ erasureRequested: requested }))
  expect(await screen.findByRole("status")).toHaveTextContent("You asked today at 12:08")
  expect(screen.queryByRole("button", { name: "Ask to delete…" })).not.toBeInTheDocument()
})

test("a request made meanwhile toasts its text and refetches", async () => {
  let made = false

  server.use(
    http.post(apiUrl("/me/erasure-request"), () => {
      made = true

      return problem(409, "privacy.alreadyRequested")
    })
  )

  const page = open(() => ({ erasureRequested: made ? requested : null }))
  await userEvent.click(await screen.findByRole("button", { name: "Ask to delete…" }))
  const dialog = within(await screen.findByRole("alertdialog"))
  await userEvent.click(dialog.getByRole("button", { name: "Send request" }))

  await vi.waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "You have already asked for your account and data to be deleted. The church office will answer within one month of your request."
    )
  )

  expect(await screen.findByRole("status")).toHaveTextContent("You asked today at 12:08")
  expect(page.reads()).toBe(2)
})

test.each([
  ["a servant's account page", me.servant, () => <AccountPage />],
  ["Hoda Farag's account page", me.parent, () => <ParentAccount />],
])("Your data is the last section of %s", async (_, account, page) => {
  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(account)),
    http.get(apiUrl("/me/erasure-request"), () => HttpResponse.json({ erasureRequested: null })),
    http.get(apiUrl("/parent/children"), () =>
      HttpResponse.json({ today: "2026-11-08", items: [] })
    )
  )

  renderWithProviders(
    <SessionProvider>
      <SidebarProvider>{page()}</SidebarProvider>
    </SessionProvider>
  )

  const groups = await screen.findAllByRole("group")
  await screen.findByRole("button", { name: "Ask to delete…" })
  const panels = groups.filter((g) => g.getAttribute("aria-labelledby") && g.querySelector("h2"))
  expect(panels.at(-1)).toHaveTextContent(/^Your data/)
})

test("reads in Arabic", async () => {
  open(undefined, "ar")
  expect(await screen.findByRole("heading", { name: "بياناتك" })).toBeInTheDocument()
})
