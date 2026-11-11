import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { type Me, meQuery } from "@/features/identity/auth/api"
import {
  forgetOutcome,
  lastOutcome,
  scheduledErasureOn,
} from "@/features/identity/auth/auth-outcome"
import { SessionProvider } from "@/features/identity/auth/session"
import { ParentAccountPage } from "@/features/portals/parent/parent-account-page"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import { expectNoToast, expectToast } from "@test/support/toasts"
import { AccountPage } from "@/features/identity/account/account-page"
import { OwnData } from "@/features/privacy/own-data/own-data"

const PASSWORD = "correct horse battery"
const requested = { receivedAt: "2026-11-08T11:08:00Z", dueOn: "2026-12-08" }
const scheduled = { receivedAt: "2026-11-08T11:08:00Z", erasesOn: "2026-11-22" }
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
  forgetOutcome()
})

function open(
  erasure: () => Record<string, unknown> = () => ({ erasureRequested: null }),
  locale: Locale = "en",
  who: Me = me.servant
) {
  let reads = 0

  server.use(
    http.get(apiUrl("/me/erasure-request"), () => {
      reads++

      return HttpResponse.json(erasure())
    })
  )

  const { client } = renderWithProviders(<OwnData today="2026-11-08" />, { locale, me: who })

  return { client, reads: () => reads }
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
  await expectToast("Something went wrong on our side. Try again later.")
  expect(clicks).toEqual([])
  expect(URL.createObjectURL).not.toHaveBeenCalled()
})

async function openDialog() {
  await userEvent.click(await screen.findByRole("button", { name: "Delete account…" }))

  return within(await screen.findByRole("alertdialog"))
}

function answerErasure(...answers: (() => Response)[]) {
  const posted: unknown[] = []

  server.use(
    http.post(apiUrl("/me/erasure-request"), async ({ request }) => {
      posted.push(await request.json())

      return (answers[posted.length - 1] ?? answers.at(-1)!)()
    })
  )

  return posted
}

const scheduledAnswer = () => HttpResponse.json(scheduled, { status: 201 })

test.each([
  [
    "with a note",
    "Please delete my children’s data too.",
    { password: PASSWORD, note: "Please delete my children’s data too." },
  ],
  ["without a note", "", { password: PASSWORD }],
])(
  "deleting %s sends the password, ends the session and opens the scheduled page",
  async (_, note, body) => {
    const posted = answerErasure(scheduledAnswer)
    const page = open()
    const dialog = await openDialog()
    await userEvent.type(dialog.getByLabelText("Your password"), PASSWORD)

    if (note) {
      await userEvent.type(
        dialog.getByRole("textbox", { name: /Anything the office should know/ }),
        note
      )
    }

    await userEvent.click(dialog.getByRole("button", { name: "Delete my account" }))

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledExactlyOnceWith("/sign-in/erasure-scheduled/")
    )

    expect(posted).toEqual([body])
    expect(lastOutcome()).toBe("erasureScheduled")
    expect(scheduledErasureOn()).toBe("2026-11-22")
    expect(page.client.getQueryData(meQuery.queryKey)).toBeUndefined()
    expectNoToast()
  }
)

test("the dialog says what goes and that the account locks at once for 14 days", async () => {
  open()
  const dialog = await openDialog()

  expect(
    dialog.getByText(
      "Your account is locked at once. After 14 days it is deleted for good, unless you cancel the erasure on the sign-in page before then."
    )
  ).toBeInTheDocument()

  expect(dialog.getByText("Your account and its sign-in")).toBeInTheDocument()
  expect(dialog.queryByText(/Your own member record/)).not.toBeInTheDocument()
  expect(dialog.queryByText(/Your children’s records stay/)).not.toBeInTheDocument()

  expect(
    dialog.getByText("Attendance totals of past meetings stay, without your name.")
  ).toBeInTheDocument()

  expect(dialog.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
})

test("a parent with a member record reads that the record goes and the children stay", async () => {
  open(undefined, "en", {
    ...me.parent,
    member: { personId: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea111", groupCount: 1 },
  })

  const dialog = await openDialog()

  expect(
    dialog.getByText("Your own member record, with your attendance marks and homework reports")
  ).toBeInTheDocument()

  expect(dialog.getByText(/Your children’s records stay\./)).toBeInTheDocument()

  expect(
    dialog.getByText("For example, whether your children’s data should be deleted too.")
  ).toBeInTheDocument()
})

test("a wrong password shows under the field and keeps the dialog and the session", async () => {
  const posted = answerErasure(() =>
    problem(422, "validation.failed", {
      fieldErrors: { password: { code: "accounts.currentPasswordWrong", params: {} } },
    })
  )

  open()
  const dialog = await openDialog()
  await userEvent.type(dialog.getByLabelText("Your password"), "wrong horse")
  await userEvent.click(dialog.getByRole("button", { name: "Delete my account" }))

  expect(await dialog.findByText("This is not your current password.")).toBeInTheDocument()
  expect(dialog.getByLabelText("Your password")).toHaveAttribute("aria-invalid", "true")
  await waitFor(() => expect(dialog.getByLabelText("Your password")).toHaveFocus())
  expect(posted).toHaveLength(1)
  expectNoToast()
  expect(router.replace).not.toHaveBeenCalled()
  expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  expect(lastOutcome()).toBeNull()
})

test.each([
  [
    "too many attempts",
    () => problem(429, "auth.tooManyAttempts", { headers: { "Retry-After": "60" } }),
    "Too many attempts. Wait a few minutes and try again.",
  ],
  [
    "the last administrator",
    () => problem(409, "roles.lastAdministrator"),
    "At least one active account must be able to change roles. Give that permission to someone else first.",
  ],
])("%s toasts and keeps the dialog open", async (_, answer, text) => {
  answerErasure(answer)
  open()
  const dialog = await openDialog()
  await userEvent.type(dialog.getByLabelText("Your password"), PASSWORD)
  await userEvent.click(dialog.getByRole("button", { name: "Delete my account" }))
  await expectToast(text)
  expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  expect(router.replace).not.toHaveBeenCalled()
})

test("a request made meanwhile toasts its text, closes the dialog and refetches", async () => {
  let made = false

  answerErasure(() => {
    made = true

    return problem(409, "privacy.alreadyRequested")
  })

  const page = open(() => ({ erasureRequested: made ? requested : null }))
  const dialog = await openDialog()
  await userEvent.type(dialog.getByLabelText("Your password"), PASSWORD)
  await userEvent.click(dialog.getByRole("button", { name: "Delete my account" }))

  await expectToast(
    "You have already asked for your account and data to be deleted. The church office will answer within one month of your request."
  )

  expect(await screen.findByRole("status")).toHaveTextContent("You asked today at 12:08")
  expect(page.reads()).toBe(2)
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
})

test("while deleting, a second click sends nothing and Escape doesn't close the dialog", async () => {
  let answer = () => {}
  const posted: unknown[] = []

  server.use(
    http.post(apiUrl("/me/erasure-request"), async ({ request }) => {
      posted.push(await request.json())
      await new Promise<void>((resolve) => (answer = resolve))

      return HttpResponse.json(scheduled, { status: 201 })
    })
  )

  open()
  const dialog = await openDialog()
  await userEvent.type(dialog.getByLabelText("Your password"), PASSWORD)
  await userEvent.dblClick(dialog.getByRole("button", { name: "Delete my account" }))
  await waitFor(() => expect(dialog.getByRole("button", { name: "Cancel" })).toBeDisabled())
  await userEvent.keyboard("{Escape}")
  expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  answer()
  await waitFor(() => expect(router.replace).toHaveBeenCalled())
  expect(posted).toHaveLength(1)
})

test("Cancel closes the dialog without sending anything", async () => {
  const posted = answerErasure(scheduledAnswer)
  open()
  const dialog = await openDialog()
  await userEvent.type(dialog.getByLabelText("Your password"), PASSWORD)
  await userEvent.click(dialog.getByRole("button", { name: "Cancel" }))
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
  expect(posted).toEqual([])
})

test("an erasure status that fails to load says so and can be retried", async () => {
  open()
  server.use(http.get(apiUrl("/me/erasure-request"), () => problem(403, "forbidden")))
  expect(await screen.findByText("This couldn’t be loaded.")).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
})

test("an open request shows on load without the button", async () => {
  open(() => ({ erasureRequested: requested }))
  expect(await screen.findByRole("status")).toHaveTextContent("You asked today at 12:08")
  expect(screen.queryByRole("button", { name: "Delete account…" })).not.toBeInTheDocument()
})

test.each([
  ["a servant's account page", me.servant, () => <AccountPage />],
  ["Hoda Farag's account page", me.parent, () => <ParentAccountPage />],
])("Your data is the last section of %s", async (_, account, page) => {
  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(account)),
    http.get(apiUrl("/me/erasure-request"), () => HttpResponse.json({ erasureRequested: null })),
    http.get(apiUrl("/parent/children"), () =>
      HttpResponse.json({ today: "2026-11-08", items: [] })
    )
  )

  renderWithProviders(<SessionProvider>{page()}</SessionProvider>, { sidebar: true })

  const groups = await screen.findAllByRole("group")
  await screen.findByRole("button", { name: "Delete account…" })
  const panels = groups.filter((g) => g.getAttribute("aria-labelledby") && g.querySelector("h2"))
  expect(panels.at(-1)).toHaveTextContent(/^Your data/)
})

test("reads in Arabic", async () => {
  open(undefined, "ar")
  expect(await screen.findByRole("heading", { name: "بياناتك" })).toBeInTheDocument()
})
