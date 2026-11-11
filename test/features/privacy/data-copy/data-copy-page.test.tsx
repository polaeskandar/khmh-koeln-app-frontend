import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"
import { expectNoToast } from "@test/support/toasts"

import { DataCopyPage } from "@/features/privacy/data-copy/data-copy-page"

let clicks: { href: string; download: string }[] = []

beforeEach(() => {
  clicks = []
  URL.createObjectURL = vi.fn(() => "blob:khmk-my-data")
  URL.revokeObjectURL = vi.fn()

  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    clicks.push({ href: this.href, download: this.download })
  })
})

afterEach(() => {
  window.history.replaceState(null, "", "/")
})

function backend(...answers: (() => Response)[]) {
  const sent: { body: unknown; address: string }[] = []

  server.use(
    http.post(apiUrl("/data-copies"), async ({ request }) => {
      sent.push({ body: await request.json(), address: window.location.href })

      return (answers[sent.length - 1] ?? answers.at(-1)!)()
    })
  )

  return sent
}

const copy = () =>
  HttpResponse.json(
    { kind: "account", exportedAt: "2026-11-08T10:00:00+01:00" },
    { headers: { "Content-Disposition": 'attachment; filename="khmk-my-data.json"' } }
  )

function open(address = "/en/data-copy/#token=abc", locale: Locale = "en") {
  window.history.replaceState(null, "", address)
  renderWithProviders(<DataCopyPage />, { locale })
}

const download = async () =>
  userEvent.click(await screen.findByRole("button", { name: "Download your data" }))

test("the token leaves the address, and nothing is sent before the button", async () => {
  const sent = backend(copy)
  open()

  expect(
    await screen.findByRole("heading", { name: "Download your data", level: 1 })
  ).toBeInTheDocument()

  expect(window.location.hash).toBe("")
  expect(window.location.pathname).toBe("/en/data-copy/")
  expect(sent).toEqual([])
})

test("Download saves the file once and says the link no longer works", async () => {
  const sent = backend(copy)
  open()
  await download()

  expect(
    await screen.findByRole("heading", { name: "Your data is downloaded", level: 1 })
  ).toBeInTheDocument()

  expect(screen.getByRole("status")).toHaveTextContent(
    "The file is in your downloads. This link no longer works; for another copy, ask the church office."
  )

  expect(sent).toEqual([{ body: { token: "abc" }, address: "http://localhost:3000/en/data-copy/" }])
  expect(clicks).toEqual([{ href: "blob:khmk-my-data", download: "khmk-my-data.json" }])
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:khmk-my-data")
  expect(screen.queryByRole("button", { name: "Download your data" })).not.toBeInTheDocument()
})

test("a used, expired or unknown link says so and saves nothing", async () => {
  backend(() => problem(422, "privacy.copyLinkInvalid"))
  open()
  await download()

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This link is invalid, was already used or has expired. Ask the church office for a new one."
  )

  expect(clicks).toEqual([])
  expect(screen.queryByRole("button", { name: "Download your data" })).not.toBeInTheDocument()
  expectNoToast()
})

test.each([
  [
    "too many attempts",
    () => problem(429, "auth.tooManyAttempts", { headers: { "Retry-After": "60" } }),
    "Too many attempts. Wait a few minutes and try again.",
  ],
  [
    "no connection",
    () => HttpResponse.error(),
    "No connection. Check your internet connection and try again.",
  ],
])("%s shows an alert and Download tries again with the same token", async (_, answer, text) => {
  const sent = backend(answer, copy)
  open()
  await download()
  expect(await screen.findByRole("alert")).toHaveTextContent(text)
  await download()

  expect(
    await screen.findByRole("heading", { name: "Your data is downloaded" })
  ).toBeInTheDocument()

  expect(sent.map((request) => request.body)).toEqual([{ token: "abc" }, { token: "abc" }])
  expect(clicks).toHaveLength(1)
})

test("a double click downloads once", async () => {
  let answer = () => {}
  let sent = 0

  server.use(
    http.post(apiUrl("/data-copies"), async () => {
      sent++
      await new Promise<void>((resolve) => (answer = resolve))

      return copy()
    })
  )

  open()
  await userEvent.dblClick(await screen.findByRole("button", { name: "Download your data" }))
  answer()
  await screen.findByRole("heading", { name: "Your data is downloaded" })
  expect(sent).toBe(1)
  await waitFor(() => expect(clicks).toHaveLength(1))
})

test("without a token the page is a 404 and nothing is sent", async () => {
  const sent = backend(copy)
  open("/en/data-copy/")

  expect(
    await screen.findByRole("heading", { name: "This page doesn’t exist" })
  ).toBeInTheDocument()

  expect(sent).toEqual([])
})

test("reads in Arabic", async () => {
  backend(copy)
  open("/ar/data-copy/#token=abc", "ar")

  expect(
    await screen.findByRole("heading", { name: "تنزيل بياناتك", level: 1 })
  ).toBeInTheDocument()

  expect(screen.getByRole("button", { name: "تنزيل بياناتك" })).toBeInTheDocument()
})
