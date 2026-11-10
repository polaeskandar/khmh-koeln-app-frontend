import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Me } from "@/features/identity/auth/api"
import type { Schemas } from "@/lib/api/client"
import { SessionProvider } from "@/features/identity/auth/session"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { address } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { DataRequestDetail, ErasureReview } from "@/features/privacy/data-requests/api"
import { DataRequestPage } from "@/features/privacy/data-requests/data-request-page"

const ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea901"

beforeEach(() => {
  address.set(`id=${ID}`)
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "error")
})

const review = (extra: Partial<DataRequestDetail> = {}): DataRequestDetail => ({
  today: "2026-11-08",
  request: {
    id: ID,
    kind: "erasure",
    channel: "email",
    status: "open",
    requestedBy: "The mother, Hoda Farag",
    receivedAt: "2026-11-02T10:00:00Z",
    dueOn: "2026-12-02",
    closedAt: null,
    closedBy: null,
    declineReason: null,
    subjectName: "Kirollos Iskander",
    erasedSubject: null,
    erasesOn: null,
    note: null,
    outcome: null,
  },
  member: {
    id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea111",
    firstName: "Kirollos",
    lastName: "Iskander",
    displayName: null,
    status: "active",
    memberships: [
      { service: "Sunday School", stage: "3rd Class", from: "2025-09-07", until: null },
    ],
  },
  account: null,
  copyLink: null,
  ...extra,
})

const lessonNote = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea121",
  where: "lessonNote",
  text: "Kirollos needs extra help with reading.",
  date: "2026-11-01",
  group: "3rd Class",
}

const erasure = (extra: Partial<ErasureReview> = {}): ErasureReview => ({
  erase: {
    person: 1,
    memberships: 1,
    attendance: 34,
    completions: 5,
    guardianLinks: 1,
    account: 0,
    roles: 0,
  },
  keep: { sessionTotals: 8, accountRows: 0 },
  mentions: [lessonNote],
  ...extra,
})

const erased: DataRequestDetail = {
  ...review(),
  request: {
    ...review().request,
    status: "done",
    subjectName: null,
    erasedSubject: { kind: "member", group: "3rd Class" },
    closedAt: "2026-11-08T11:00:00Z",
    closedBy: { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f01", name: "Nadia Saad" },
    outcome: {
      person: 1,
      memberships: 1,
      attendance: 34,
      completions: 5,
      guardianLinks: 1,
      notes: 1,
    },
  },
  member: null,
}

function open(
  first: DataRequestDetail,
  {
    who = me.administrator,
    erase,
    review = () => HttpResponse.json(erasure()),
  }: { who?: Me; erase?: () => Response; review?: () => Response } = {}
) {
  let current = first
  let reads = 0
  let reviews = 0
  const bodies: unknown[] = []

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(who)),
    http.get(apiUrl(`/data-requests/${ID}`), () => {
      reads++

      return HttpResponse.json(current)
    }),
    http.get(apiUrl(`/data-requests/${ID}/erasure`), () => {
      reviews++

      return review()
    }),
    http.post(apiUrl(`/data-requests/${ID}/erase`), async ({ request }) => {
      bodies.push(await request.json())
      const answer = erase?.()

      if (answer) {
        return answer
      }

      current = erased

      return HttpResponse.json(erased.request)
    })
  )

  renderWithProviders(
    <SessionProvider>
      <SidebarProvider>
        <DataRequestPage />
      </SidebarProvider>
    </SessionProvider>
  )

  return { bodies, reads: () => reads, reviews: () => reviews }
}

const section = async (name: string | RegExp) =>
  within((await screen.findByRole("heading", { name })).closest("section")!)

test("the review lists what goes, what stays, and the notes that may mention them", async () => {
  open(review())

  expect(
    await screen.findByRole("heading", { name: "Kirollos Iskander", level: 1 })
  ).toBeInTheDocument()

  const erases = await section("What erasing deletes")
  expect(erases.getByText("The member record")).toBeInTheDocument()
  expect(erases.getByText("34 attendance marks")).toBeInTheDocument()

  expect(
    (await section("What stays, without the name")).getByText("Attendance totals of 8 meetings")
  ).toBeInTheDocument()

  const mentions = await section("Notes that may mention them (1)")
  expect(mentions.getByText("Lesson notes · 3rd Class · Sun 1 Nov 2026")).toBeInTheDocument()

  expect(mentions.getByText("Kirollos needs extra help with reading.")).toHaveAttribute(
    "dir",
    "auto"
  )

  expect(screen.getByText("Who it is about")).toBeInTheDocument()
})

test("erasing empties the notes by default, then shows the outcome", async () => {
  const { bodies } = open(review())
  await userEvent.click(await screen.findByRole("button", { name: "Erase data…" }))
  const dialog = within(await screen.findByRole("alertdialog"))

  expect(
    dialog.getByRole("checkbox", { name: "Also empty the note that may mention them" })
  ).toHaveAttribute("aria-checked", "true")

  await userEvent.click(dialog.getByRole("button", { name: "Erase data" }))

  expect(
    await screen.findByRole("heading", { name: "Erased member of 3rd Class", level: 1 })
  ).toBeInTheDocument()

  expect(bodies).toEqual([{ clearNotes: true }])
  expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent(/Erased$/)
  expect(screen.getByText("1 note that mentioned them, emptied")).toBeInTheDocument()
  expect(screen.queryByText("Who it is about")).not.toBeInTheDocument()
})

test("unticking keeps the notes", async () => {
  const { bodies } = open(review())
  await userEvent.click(await screen.findByRole("button", { name: "Erase data…" }))
  const dialog = within(await screen.findByRole("alertdialog"))

  await userEvent.click(
    dialog.getByRole("checkbox", { name: "Also empty the note that may mention them" })
  )

  await userEvent.click(dialog.getByRole("button", { name: "Erase data" }))
  await waitFor(() => expect(bodies).toEqual([{ clearNotes: false }]))
})

test("a removal reason reads as a correction note", async () => {
  open(review(), {
    review: () =>
      HttpResponse.json(erasure({ mentions: [{ ...lessonNote, where: "removalReason" }] })),
  })

  const mentions = await section("Notes that may mention them (1)")
  expect(mentions.getByText("Correction note · 3rd Class · Sun 1 Nov 2026")).toBeInTheDocument()
})

test("without mentions there is no checkbox", async () => {
  open(review(), { review: () => HttpResponse.json(erasure({ mentions: [] })) })
  await userEvent.click(await screen.findByRole("button", { name: "Erase data…" }))

  expect(
    within(await screen.findByRole("alertdialog")).queryByRole("checkbox")
  ).not.toBeInTheDocument()

  expect(screen.getByText("No notes mention their name.")).toBeInTheDocument()
})

test("one's own account can't be erased here, and is not reviewed", async () => {
  const page = open(
    review({
      member: null,
      account: {
        id: me.administrator.account.id,
        name: me.administrator.account.displayName,
        email: me.administrator.account.email,
        roles: ["Administrator"],
      },
    })
  )

  expect(await screen.findByRole("button", { name: "Erase data…" })).toBeDisabled()
  expect(screen.getByText(/This request is about your own account/)).toBeInTheDocument()
  expect(screen.queryByRole("heading", { name: "What erasing deletes" })).toBeNull()
  expect(page.reviews()).toBe(0)
})

test("a subject that is gone can't be erased", async () => {
  const page = open(review({ member: null, account: null }))
  expect(await screen.findByRole("button", { name: "Erase data…" })).toBeDisabled()
  expect(screen.getByText("The data this request is about no longer exists.")).toBeInTheDocument()
  expect(page.reviews()).toBe(0)
})

test("a review the API refuses says why, and Erase stays disabled", async () => {
  open(review(), { review: () => problem(409, "roles.lastAdministrator") })

  expect(
    await screen.findByText(
      "At least one active account must be able to change roles. Give that permission to someone else first."
    )
  ).toBeInTheDocument()

  expect(screen.getByRole("button", { name: "Erase data…" })).toBeDisabled()
})

test("a request closed meanwhile toasts and refetches", async () => {
  const page = open(review(), { erase: () => problem(409, "privacy.notOpen") })
  await userEvent.click(await screen.findByRole("button", { name: "Erase data…" }))

  await userEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Erase data" })
  )

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("This request has already been closed.")
  )

  await waitFor(() => expect(page.reads()).toBeGreaterThanOrEqual(2))
})

test.each([
  ["leaders", me.leader],
  ["servants", me.servant],
  ["the church office", me.churchOffice],
])("%s get NoAccess without a request", async (_, who) => {
  const page = open(review(), { who })
  expect(await screen.findByText("You can’t handle data protection requests")).toBeInTheDocument()
  expect(page.reads()).toBe(0)
})

test("a self-service erasure says when it is erased automatically, and Erase stays", async () => {
  open(review({ request: { ...review().request, channel: "app", erasesOn: "2026-11-22" } }))

  expect(
    await screen.findByText(
      "Erased automatically on Sunday 22 November 2026, unless the person cancels before then. You can also erase the data now."
    )
  ).toBeInTheDocument()

  await waitFor(() => expect(screen.getByRole("button", { name: "Erase data…" })).toBeEnabled())
})

test("an erasure done on its date reads as erased automatically, by nobody", async () => {
  open({
    ...erased,
    request: { ...erased.request, erasesOn: "2026-11-08", closedBy: null },
  })

  const outcome = await section("Outcome")
  expect(outcome.getByText(/^Erased automatically today at 12:00/)).toBeInTheDocument()
  expect(outcome.queryByText(/ by /)).not.toBeInTheDocument()
})

test("a withdrawn erasure reads Withdrawn and says the person kept the account", async () => {
  open(
    review({
      request: {
        ...review().request,
        status: "withdrawn",
        channel: "app",
        erasesOn: "2026-11-21",
        closedAt: "2026-11-07T10:00:00Z",
      },
    })
  )

  expect(await screen.findByText("Withdrawn")).toBeInTheDocument()

  expect(
    (await section("Outcome")).getByText(
      "Withdrawn yesterday at 11:00: the person canceled the erasure and kept their account."
    )
  ).toBeInTheDocument()

  expect(screen.queryByRole("button", { name: "Erase data…" })).not.toBeInTheDocument()
  expect(screen.queryByText(/Erased automatically/)).not.toBeInTheDocument()
})

describe("a copy request", () => {
  const URL_SENT = "https://app.khmk-koeln.com/en/data-copy/#token=kXh2abc"
  const NEW_URL = "https://app.khmk-koeln.com/en/data-copy/#token=nEw9xyz"

  const hoda = {
    id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea131",
    name: "Hoda Farag",
    email: "hoda@example.org",
    roles: ["Parent"],
  }

  const copyRequest = (extra: Partial<DataRequestDetail> = {}): DataRequestDetail =>
    review({
      request: { ...review().request, kind: "copy", subjectName: "Hoda Farag" },
      member: null,
      account: hoda,
      ...extra,
    })

  const created = (url: string, emailedTo: string | null) => () =>
    HttpResponse.json({ url, expiresAt: "2099-11-15T10:00:00Z", emailedTo }, { status: 201 })

  function openCopy(
    first: DataRequestDetail,
    answers: (() => Response)[] = [created(URL_SENT, "hoda@example.org")]
  ) {
    let current = first
    let reads = 0
    const posted: unknown[] = []

    server.use(
      http.get(apiUrl("/me"), () => HttpResponse.json(me.administrator)),
      http.get(apiUrl(`/data-requests/${ID}`), () => {
        reads++

        return HttpResponse.json(current)
      }),
      http.post(apiUrl(`/data-requests/${ID}/copy-link`), async ({ request }) => {
        posted.push(await request.json())
        const answer = (answers[posted.length - 1] ?? answers.at(-1)!)()

        if (answer.status === 201) {
          const link = (await answer.clone().json()) as Schemas["CopyLinkResponse"]

          current = {
            ...current,
            copyLink: { expiresAt: link.expiresAt, emailedTo: link.emailedTo, usedAt: null },
          }
        }

        return answer
      })
    )

    renderWithProviders(
      <SessionProvider>
        <SidebarProvider>
          <DataRequestPage />
        </SidebarProvider>
      </SessionProvider>
    )

    return { posted, reads: () => reads }
  }

  beforeEach(() => {
    vi.spyOn(toast, "success")
  })

  test("without a link it offers Create download link and no erasure", async () => {
    openCopy(copyRequest())
    const panel = await section("Download link")

    expect(
      panel.getByText(
        "A one-time link for the person to download their data themselves. It works once, for 7 days, and the request closes when it is used."
      )
    ).toBeInTheDocument()

    expect(panel.getByRole("button", { name: "Create download link" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Erase data…" })).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "What erasing deletes" })).toBeNull()
  })

  test("creating a link shows it with Copy, its expiry and where it was emailed", async () => {
    const page = openCopy(copyRequest())
    const panel = await section("Download link")
    await userEvent.click(panel.getByRole("button", { name: "Create download link" }))

    const link = await panel.findByRole("textbox", { name: "Link" })
    expect(link).toHaveValue(URL_SENT)
    expect(link).toHaveAttribute("dir", "ltr")
    expect(link).toHaveAttribute("readonly")
    expect(panel.getByText("Copy it now: the link is shown only this once.")).toBeInTheDocument()
    expect(panel.getByText("Works until Sun 15 Nov, 11:00.")).toBeInTheDocument()
    expect(panel.getByText("hoda@example.org")).toHaveAttribute("dir", "ltr")

    expect(panel.getByText("hoda@example.org").parentElement).toHaveTextContent(
      "Emailed to hoda@example.org."
    )

    expect(page.posted).toEqual([{}])
    await waitFor(() => expect(page.reads()).toBe(2))
    expect(panel.getByRole("button", { name: "Create a new link" })).toBeInTheDocument()
    expect(panel.queryByText(/shown only once, when it was created/)).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(panel.getByRole("button", { name: "Copy" }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Link copied."))
    expect(await navigator.clipboard.readText()).toBe(URL_SENT)
  })

  test("a copy the browser refuses says to copy it by hand", async () => {
    openCopy(copyRequest())
    const panel = await section("Download link")
    await userEvent.click(panel.getByRole("button", { name: "Create download link" }))
    await panel.findByRole("textbox", { name: "Link" })
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"))
    await user.click(panel.getByRole("button", { name: "Copy" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn’t copy. Select the link and copy it yourself."
      )
    )
  })

  test("a member without an account gets a link to hand over", async () => {
    openCopy(copyRequest({ account: null, member: review().member }), [created(URL_SENT, null)])
    const panel = await section("Download link")
    await userEvent.click(panel.getByRole("button", { name: "Create download link" }))

    expect(
      await panel.findByText(
        "Not emailed, because there is no account to send it to. Hand it over yourself in a safe way, for example in person."
      )
    ).toBeInTheDocument()
  })

  test("an existing link shows its state without the link, and a new one voids it", async () => {
    const page = openCopy(
      copyRequest({
        copyLink: {
          expiresAt: "2099-11-15T10:00:00Z",
          emailedTo: "hoda@example.org",
          usedAt: null,
        },
      }),
      [created(NEW_URL, "hoda@example.org")]
    )

    const panel = await section("Download link")
    expect(panel.getByText("Works until Sun 15 Nov, 11:00.")).toBeInTheDocument()

    expect(
      panel.getByText("The link itself was shown only once, when it was created.")
    ).toBeInTheDocument()

    expect(panel.queryByRole("textbox")).not.toBeInTheDocument()
    expect(panel.queryByRole("button", { name: "Create download link" })).not.toBeInTheDocument()
    await userEvent.click(panel.getByRole("button", { name: "Create a new link" }))
    const dialog = within(await screen.findByRole("alertdialog"))
    expect(dialog.getByText("The current link stops working at once.")).toBeInTheDocument()
    await userEvent.click(dialog.getByRole("button", { name: "Create new link" }))

    expect(await panel.findByRole("textbox", { name: "Link" })).toHaveValue(NEW_URL)
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(page.posted).toEqual([{}])
  })

  test("Cancel keeps the old link", async () => {
    const page = openCopy(
      copyRequest({
        copyLink: { expiresAt: "2099-11-15T10:00:00Z", emailedTo: null, usedAt: null },
      })
    )

    await userEvent.click(
      (await section("Download link")).getByRole("button", { name: "Create a new link" })
    )

    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" })
    )

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(page.posted).toEqual([])
  })

  test("an expired link says so", async () => {
    openCopy(
      copyRequest({
        copyLink: { expiresAt: "2026-11-01T10:00:00Z", emailedTo: null, usedAt: null },
      })
    )

    expect(
      (await section("Download link")).getByText("Expired on Sun 1 Nov at 11:00.")
    ).toBeInTheDocument()
  })

  test("a used link closed the request: it says when, and offers nothing", async () => {
    openCopy(
      copyRequest({
        request: { ...copyRequest().request, status: "done", closedAt: "2026-11-08T11:08:00Z" },
        copyLink: {
          expiresAt: "2099-11-15T10:00:00Z",
          emailedTo: "hoda@example.org",
          usedAt: "2026-11-08T11:08:00Z",
        },
      })
    )

    const panel = await section("Download link")
    expect(panel.getByText("Used today at 12:08.")).toBeInTheDocument()
    expect(panel.queryByRole("button")).not.toBeInTheDocument()

    expect(
      (await section("Outcome")).getByText("Copy downloaded by the person today at 12:08")
    ).toBeInTheDocument()

    expect(screen.getByText("Done")).toBeInTheDocument()
  })

  test.each([
    ["privacy.notOpen", "This request has already been closed."],
    ["privacy.notCopy", "This is not a request for a copy."],
    ["privacy.subjectGone", "The data this request is about no longer exists."],
  ])("a refusal (%s) toasts its text and refetches", async (code, text) => {
    const page = openCopy(copyRequest(), [() => problem(409, code)])
    const panel = await section("Download link")
    await userEvent.click(panel.getByRole("button", { name: "Create download link" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(text))
    await waitFor(() => expect(page.reads()).toBeGreaterThanOrEqual(2))
    expect(panel.queryByRole("textbox")).not.toBeInTheDocument()
  })

  test("a double click creates one link", async () => {
    let answer = () => {}
    const page = openCopy(copyRequest())

    server.use(
      http.post(apiUrl(`/data-requests/${ID}/copy-link`), async ({ request }) => {
        page.posted.push(await request.json())
        await new Promise<void>((resolve) => (answer = resolve))

        return created(URL_SENT, null)()
      })
    )

    const panel = await section("Download link")
    await userEvent.dblClick(panel.getByRole("button", { name: "Create download link" }))
    answer()
    expect(await panel.findByRole("textbox", { name: "Link" })).toHaveValue(URL_SENT)
    expect(page.posted).toHaveLength(1)
  })

  test("a subject that is gone gets no link", async () => {
    openCopy(copyRequest({ account: null, member: null }))
    const panel = await section("Download link")
    expect(panel.getByText("The data this request is about no longer exists.")).toBeInTheDocument()
    expect(panel.queryByRole("button")).not.toBeInTheDocument()
  })

  test("reads in Arabic with the address left to right", async () => {
    server.use(
      http.get(apiUrl("/me"), () => HttpResponse.json(me.administrator)),
      http.get(apiUrl(`/data-requests/${ID}`), () =>
        HttpResponse.json(
          copyRequest({
            copyLink: {
              expiresAt: "2099-11-15T10:00:00Z",
              emailedTo: "hoda@example.org",
              usedAt: null,
            },
          })
        )
      )
    )

    renderWithProviders(
      <SessionProvider>
        <SidebarProvider>
          <DataRequestPage />
        </SidebarProvider>
      </SessionProvider>,
      { locale: "ar" }
    )

    const panel = await section("رابط التنزيل")
    expect(panel.getByText("hoda@example.org")).toHaveAttribute("dir", "ltr")
    expect(panel.getByRole("button", { name: "إنشاء رابط جديد" })).toBeInTheDocument()
  })
})
