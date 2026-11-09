import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Me } from "@/features/identity/auth/api"
import { SessionProvider } from "@/features/identity/auth/session"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { peopleList, person } from "@test/support/fixtures/people"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { PersonRow } from "@/features/people/members/api"
import { MembersPage } from "@/features/people/members/members-page"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

afterEach(() => vi.restoreAllMocks())

function open(
  initial: PersonRow,
  {
    deactivate = () => HttpResponse.json({ ...initial.person, status: "inactive" }),
    viewer = me.administrator,
  }: { deactivate?: () => Response; viewer?: Me } = {}
) {
  let lydia = initial
  const requests: URLSearchParams[] = []
  const posts: string[] = []

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(viewer)),
    http.get(apiUrl("/services"), () => HttpResponse.json(services)),
    http.get(apiUrl("/people"), ({ request }) => {
      const params = new URL(request.url).searchParams
      requests.push(params)
      const status = params.get("status")
      const matches = status === "all" || lydia.person.status === status ? [lydia] : []
      const total = (status === "active" ? 120 : status === "inactive" ? 1 : 121) + matches.length

      return HttpResponse.json(peopleList(matches, { total }))
    }),
    http.post(apiUrl(`/people/${initial.person.id}/deactivate`), () => {
      posts.push("deactivate")
      const response = deactivate()

      if (response.ok) {
        lydia = { ...lydia, person: { ...lydia.person, status: "inactive" } }
      }

      return response
    }),
    http.post(apiUrl(`/people/${initial.person.id}/reactivate`), () => {
      posts.push("reactivate")
      lydia = { ...lydia, person: { ...lydia.person, status: "active" }, placements: [] }

      return HttpResponse.json(lydia.person)
    })
  )

  renderWithProviders(
    <SessionProvider>
      <SidebarProvider>
        <MembersPage />
      </SidebarProvider>
    </SessionProvider>
  )

  return { requests, posts }
}

const lydia = () => person("Lydia", "Aziz")

const inactive = (row: PersonRow): PersonRow => ({
  ...row,
  person: { ...row.person, status: "inactive" },
})

const openSheet = async () => {
  const table = within(await screen.findByRole("table"))
  await userEvent.click(table.getByRole("button", { name: /Lydia Aziz/ }))

  return within(await screen.findByRole("dialog"))
}

test("tabs show each status's total, and Inactive asks for page 1 of the inactive", async () => {
  const { requests } = open(lydia())
  expect(await screen.findByRole("tab", { name: "Active (121)" })).toBeInTheDocument()
  expect(await screen.findByRole("tab", { name: "Inactive (1)" })).toBeInTheDocument()
  expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument()
  await userEvent.click(screen.getByRole("tab", { name: /^Inactive/ }))
  await waitFor(() => expect(requests.at(-1)?.get("status")).toBe("inactive"))
  expect(requests.at(-1)?.get("page")).toBe("1")
})

test("marking as inactive on Active drops the person and closes the sheet", async () => {
  const { posts } = open(lydia())
  const sheet = await openSheet()
  await userEvent.click(sheet.getByRole("button", { name: "Mark as inactive" }))
  const dialog = within(await screen.findByRole("alertdialog"))
  expect(dialog.getByText(/They no longer appear on rosters/)).toBeInTheDocument()

  expect(
    dialog.getByText(/Their attendance and memberships stay in the history/)
  ).toBeInTheDocument()

  expect(dialog.getByText(/You can reactivate them at any time/)).toBeInTheDocument()
  await userEvent.click(dialog.getByRole("button", { name: "Mark as inactive" }))

  await waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith(
      "Marked as inactive. They no longer appear on rosters."
    )
  )

  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  expect(posts).toEqual(["deactivate"])
})

test("on All the sheet stays open with the badge and Reactivate, and no Add to", async () => {
  open(lydia())
  await userEvent.click(await screen.findByRole("tab", { name: "All" }))
  const sheet = await openSheet()
  await userEvent.click(sheet.getByRole("button", { name: "Mark as inactive" }))

  await userEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Mark as inactive" })
  )

  expect(await sheet.findByRole("button", { name: "Reactivate" })).toBeInTheDocument()
  expect(sheet.getByText("Inactive")).toBeInTheDocument()
  expect(sheet.queryByRole("combobox", { name: "Add to" })).not.toBeInTheDocument()
  expect(sheet.queryByRole("button", { name: /^Remove from/ })).not.toBeInTheDocument()
})

test("reactivating shows the person under Active with no service", async () => {
  const { posts } = open(inactive(lydia()))
  await userEvent.click(await screen.findByRole("tab", { name: /^Inactive/ }))
  const sheet = await openSheet()
  await userEvent.click(sheet.getByRole("button", { name: "Reactivate" }))
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Reactivated."))
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  await userEvent.click(screen.getByRole("tab", { name: /^Active/ }))

  const row = (
    await within(await screen.findByRole("table")).findByRole("button", { name: /Lydia Aziz/ })
  ).closest("tr")!

  expect(row).toHaveTextContent("No service")
  expect(posts).toEqual(["reactivate"])
})

test("without members: update there is no footer", async () => {
  open(lydia(), { viewer: me.servant })
  const sheet = await openSheet()
  expect(sheet.queryByRole("button", { name: "Mark as inactive" })).not.toBeInTheDocument()
})

test("a 403 on deactivate toasts and changes nothing", async () => {
  open(lydia(), {
    deactivate: () => problem(403, "people.changeNotAllowed"),
  })

  const sheet = await openSheet()
  await userEvent.click(sheet.getByRole("button", { name: "Mark as inactive" }))

  await userEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Mark as inactive" })
  )

  await waitFor(() => expect(toast.error).toHaveBeenCalled())
  expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  expect(sheet.getByRole("button", { name: "Mark as inactive", hidden: true })).toBeInTheDocument()
})
