import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import { SessionProvider } from "@/features/identity/auth/session"
import type { Schemas } from "@/lib/api/client"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { peopleList, person } from "@test/support/fixtures/people"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { DataRequestRow, DataRequests } from "@/features/privacy/data-requests/api"
import { DataRequestsPage } from "@/features/privacy/data-requests/data-requests-page"
import { DueLabel } from "@/features/privacy/data-requests/request-bits"

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
})

const row = (id: string, extra: Partial<DataRequestRow>): DataRequestRow => ({
  id,
  kind: "erasure",
  channel: "email",
  status: "open",
  requestedBy: "The mother, Hoda Farag",
  receivedAt: "2026-11-02T10:00:00Z",
  dueOn: "2026-12-02",
  note: null,
  closedAt: null,
  closedBy: null,
  declineReason: null,
  outcome: null,
  subjectName: "Kirollos Iskander",
  erasedSubject: null,
  erasesOn: null,
  ...extra,
})

const mockup: DataRequests = {
  today: "2026-11-08",
  open: [row("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea901", {})],
  closed: [
    row("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea902", {
      status: "done",
      subjectName: null,
      erasedSubject: { kind: "member", group: "Youth Meeting" },
      closedAt: "2026-10-20T10:00:00Z",
      closedBy: { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f01", name: "Mariam Fahmy" },
    }),
    row("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea903", {
      status: "withdrawn",
      channel: "app",
      requestedBy: "Mina Gerges",
      subjectName: "Mina Gerges",
      erasesOn: "2026-11-21",
      closedAt: "2026-11-07T10:00:00Z",
    }),
  ],
}

function open(who: Me = me.administrator) {
  const calls = { list: 0, people: [] as string[], posts: [] as unknown[] }

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(who)),
    http.get(apiUrl("/data-requests"), () => {
      calls.list++

      return HttpResponse.json(mockup)
    }),
    http.get(apiUrl("/people"), ({ request }) => {
      calls.people.push(new URL(request.url).search)

      return HttpResponse.json(peopleList([person("Kirollos", "Iskander")]))
    }),
    http.get(apiUrl("/guardian-links"), () =>
      HttpResponse.json({
        items: [],
        accounts: [],
        today: "2026-11-08",
      } satisfies Schemas["ParentAccessListResponse"])
    )
  )

  renderWithProviders(
    <SessionProvider>
      <DataRequestsPage />
    </SessionProvider>,
    { sidebar: true }
  )

  return calls
}

describe("DueLabel", () => {
  test.each([
    ["2026-11-16", "quiet", "8 days left"],
    ["2026-11-15", "soon", "7 days left"],
    ["2026-11-08", "soon", "due today"],
    ["2026-11-06", "late", "2 days late"],
  ])("due %s reads %s", (dueOn, tone, text) => {
    renderWithProviders(<DueLabel dueOn={dueOn} today="2026-11-08" />)
    const label = screen.getByText(text).closest("[data-tone]")!
    expect(label).toHaveAttribute("data-tone", tone)
  })
})

test.each([
  ["leaders", me.leader],
  ["servants", me.servant],
  ["the church office", me.churchOffice],
])("%s get NoAccess without asking for requests", async (_, who) => {
  const calls = open(who)
  expect(await screen.findByText("You can’t handle data protection requests")).toBeInTheDocument()
  expect(calls.list).toBe(0)
})

test("shows the open and closed requests as in the mockup", async () => {
  open()
  expect(await screen.findByRole("heading", { name: "Open (1)" })).toBeInTheDocument()
  expect(screen.getByText("Wed 2 Dec").parentElement).toHaveTextContent("Wed 2 Dec24 days left")

  expect(screen.getByRole("link", { name: "Kirollos Iskander" })).toHaveAttribute(
    "href",
    "/settings/data-requests/view/?id=0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea901"
  )

  expect(screen.getByText("Erased member of Youth Meeting")).toBeInTheDocument()
})

test("a withdrawn request reads Withdrawn, closed without anyone from the office", async () => {
  open()
  const link = await screen.findByRole("link", { name: "Mina Gerges" })
  const cells = within(link.closest("tr")!)
  expect(cells.getByText("Withdrawn")).toBeInTheDocument()
  expect(cells.getByText("yesterday at 11:00")).toBeInTheDocument()
  expect(cells.getByText("In the app")).toBeInTheDocument()
  expect(link.closest("tr")).not.toHaveTextContent(/ by /)
})

describe("the record dialog", () => {
  async function openDialog() {
    await userEvent.click(await screen.findByRole("button", { name: "Record a request" }))

    return within(await screen.findByRole("dialog"))
  }

  test("searches members once with every status", async () => {
    const calls = open()
    const dialog = await openDialog()
    await userEvent.type(dialog.getByRole("textbox", { name: "Find a member by name" }), "Kirollos")
    expect(await dialog.findByRole("radio", { name: "Kirollos Iskander" })).toBeInTheDocument()
    expect(calls.people.filter((q) => q.includes("q=Kirollos"))).toEqual(["?status=all&q=Kirollos"])
  })

  test("422s show under their fields", async () => {
    open()

    server.use(
      http.post(apiUrl("/data-requests"), () =>
        problem(422, "validation.failed", {
          fieldErrors: {
            subject: { code: "privacy.chooseSubject", params: {} },
            "receipt.requestedBy": { code: "privacy.requestedByRequired", params: {} },
            "receipt.receivedOn": { code: "privacy.receivedInFuture", params: {} },
          },
        })
      )
    )

    const dialog = await openDialog()
    await userEvent.click(dialog.getByRole("button", { name: "Record request" }))

    expect(
      await dialog.findByText("Choose the member or account the request is about.")
    ).toBeInTheDocument()

    expect(dialog.getByText("Enter who made the request.")).toBeInTheDocument()
    expect(dialog.getByText("The date can’t be in the future.")).toBeInTheDocument()
  })

  test("stays open while saving, then opens the new request", async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    const calls = open()

    server.use(
      http.post(apiUrl("/data-requests"), async ({ request }) => {
        calls.posts.push(await request.json())
        await gate

        return HttpResponse.json({ id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea999" }, { status: 201 })
      })
    )

    const dialog = await openDialog()
    await userEvent.type(dialog.getByRole("textbox", { name: "Find a member by name" }), "Kirollos")
    await userEvent.click(await dialog.findByRole("radio", { name: "Kirollos Iskander" }))

    await userEvent.type(
      dialog.getByRole("textbox", { name: "Asked by" }),
      "The mother, Hoda Farag"
    )

    await userEvent.click(dialog.getByRole("button", { name: "Record request" }))
    await userEvent.keyboard("{Escape}")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    release()

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(
        "/settings/data-requests/view/?id=0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea999"
      )
    )

    expect(calls.posts[0]).toMatchObject({
      kind: "erasure",
      subject: { personId: expect.any(String) },
      receipt: {
        requestedBy: "The mother, Hoda Farag",
        channel: "email",
        receivedOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      },
    })
  })

  test("Cancel closes it without recording", async () => {
    const calls = open()

    server.use(
      http.post(apiUrl("/data-requests"), async ({ request }) => {
        calls.posts.push(await request.json())

        return HttpResponse.json({ id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea999" }, { status: 201 })
      })
    )

    const dialog = await openDialog()
    await userEvent.type(dialog.getByRole("textbox", { name: "Asked by" }), "The mother")
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(calls.posts).toEqual([])
  })
})
