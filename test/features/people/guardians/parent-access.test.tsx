import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { apiUrl, problem } from "@test/support/api"
import { stageRef } from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { DirectoryPerson } from "@/features/people/members/api"
import type { GuardianLink, GuardianLinks } from "@/features/people/guardians/api"
import { ParentAccess } from "@/features/people/guardians/parent-access"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

afterEach(() => vi.restoreAllMocks())

const sundaySchool = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f10",
  name: "Sunday School",
  tone: 1,
  archived: false,
}

const child = (
  id: string,
  firstName: string,
  lastName: string,
  stage: string
): DirectoryPerson => ({
  id,
  firstName,
  lastName,
  displayName: null,
  groups: [{ service: sundaySchool, stage: stageRef(stage, 2) }],
})

const anna = child("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7eb101", "Anna", "Fanous", "3rd Class")
const kiro = child("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7eb102", "Kiro", "Iskander", "1st Class")

const mariamFanous = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7eb201",
  name: "Mariam Fanous",
  email: "mariam.fanous@example.org",
}

const hoda = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7eb202",
  name: "Hoda Farag",
  email: "hoda@example.org",
}

const daniel = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7eb203",
  name: "Daniel Mikhail",
  email: "daniel@example.org",
}

const link = (
  id: string,
  parent: typeof hoda,
  person: DirectoryPerson,
  extra: Partial<GuardianLink> = {}
): GuardianLink => ({
  id,
  relationship: "parent",
  parent,
  child: person,
  approvedAt: "2026-09-27T09:30:00Z",
  approvedBy: { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7eb301", name: "Mariam Fahmy" },
  ...extra,
})

function open(
  initial: GuardianLink[],
  { give, revoke }: { give?: () => Response | Promise<Response>; revoke?: () => Response } = {}
) {
  let items = initial
  let reads = 0
  const sent: { path: string; body: unknown }[] = []

  server.use(
    http.get(apiUrl("/guardian-links"), () => {
      reads++

      return HttpResponse.json({
        today: "2026-11-08",
        items,
        accounts: [mariamFanous, hoda, daniel],
      } satisfies GuardianLinks)
    }),
    http.get(apiUrl("/people/directory"), () => HttpResponse.json({ items: [kiro] })),
    http.post(apiUrl("/guardian-links"), async ({ request }) => {
      const body = (await request.json()) as { userId: string; personId: string }
      sent.push({ path: "give", body })
      const answer = give?.()

      if (answer) {
        return answer
      }

      const created = link("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7eb402", hoda, kiro)
      items = [...items, created]

      return HttpResponse.json(created, { status: 201 })
    }),
    http.post(apiUrl("/guardian-links/:id/revoke"), async ({ params, request }) => {
      sent.push({ path: `revoke ${params.id}`, body: await request.json() })
      const answer = revoke?.()

      if (answer) {
        return answer
      }

      items = items.filter((item) => item.id !== params.id)

      return new HttpResponse(null, { status: 204 })
    })
  )

  renderWithProviders(<ParentAccess />)

  return { sent, reads: () => reads }
}

const rows = async () =>
  within(await screen.findByRole("table"))
    .getAllByRole("row")
    .slice(1)

test("rows read parent, child and class, and who approved when", async () => {
  open([
    link("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7eb401", mariamFanous, anna),
    link("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7eb403", hoda, anna, { approvedBy: null }),
  ])

  const [first, second] = await rows()
  expect(first).toHaveTextContent("Mariam Fanous")
  expect(first).toHaveTextContent("mariam.fanous@example.org")
  expect(first).toHaveTextContent("Anna Fanous · 3rd Class")
  expect(first).toHaveTextContent("on Sun 27 Sep at 11:30 by Mariam Fahmy")
  expect(second).toHaveTextContent("by Former account")
  expect(screen.getByText(/2 links between parent accounts and children/)).toBeInTheDocument()
})

test("giving access sends both ids, closes, toasts and shows the row", async () => {
  const { sent } = open([])
  await userEvent.click(await screen.findByRole("button", { name: "Give a parent access" }))
  const dialog = within(await screen.findByRole("dialog"))
  const submit = dialog.getByRole("button", { name: "Give access" })
  expect(submit).toBeDisabled()
  const select = dialog.getByRole("combobox", { name: "Parent account" })

  expect(
    within(select).getByRole("option", { name: "Daniel Mikhail · daniel@example.org" })
  ).toBeInTheDocument()

  await userEvent.selectOptions(select, hoda.id)
  expect(submit).toBeDisabled()
  await userEvent.type(dialog.getByRole("textbox", { name: "Child" }), "kiro")
  await userEvent.click(await dialog.findByRole("button", { name: /Kiro Iskander/ }))
  expect(submit).toBeEnabled()
  await userEvent.click(submit)

  await waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith(
      "Access given. The parent sees this child’s published homework."
    )
  )

  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  expect(sent).toEqual([{ path: "give", body: { userId: hoda.id, personId: kiro.id } }])
  expect((await rows())[0]).toHaveTextContent("Hoda Farag")
})

test.each([
  [
    "guardians.alreadyHasAccess",
    { parent: "Hoda Farag", child: "Kiro Iskander" },
    "Hoda Farag already has access to Kiro Iskander.",
  ],
  ["guardians.accountNotActive", {}, "This account isn’t active. Approve or reactivate it first."],
])("a 409 %s shows in the open dialog", async (code, params, text) => {
  open([], { give: () => problem(409, code, { params }) })
  await userEvent.click(await screen.findByRole("button", { name: "Give a parent access" }))
  const dialog = within(await screen.findByRole("dialog"))
  await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Parent account" }), hoda.id)
  await userEvent.type(dialog.getByRole("textbox", { name: "Child" }), "kiro")
  await userEvent.click(await dialog.findByRole("button", { name: /Kiro Iskander/ }))
  await userEvent.click(dialog.getByRole("button", { name: "Give access" }))
  expect(await dialog.findByRole("alert")).toHaveTextContent(text)
  expect(toast.error).not.toHaveBeenCalled()
})

test("Escape doesn't close the dialog while access is being given", async () => {
  open([], { give: () => new Promise<Response>(() => {}) })
  await userEvent.click(await screen.findByRole("button", { name: "Give a parent access" }))
  const dialog = within(await screen.findByRole("dialog"))
  await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Parent account" }), hoda.id)
  await userEvent.type(dialog.getByRole("textbox", { name: "Child" }), "kiro")
  await userEvent.click(await dialog.findByRole("button", { name: /Kiro Iskander/ }))
  await userEvent.click(dialog.getByRole("button", { name: "Give access" }))
  await waitFor(() => expect(dialog.getByRole("button", { name: /Give access/ })).toBeDisabled())
  await userEvent.keyboard("{Escape}")
  expect(screen.getByRole("dialog")).toBeInTheDocument()
})

test("removing asks with both names and sends one revoke", async () => {
  const id = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7eb401"
  const { sent } = open([link(id, mariamFanous, anna)])
  await userEvent.click(within((await rows())[0]!).getByRole("button", { name: "Remove" }))
  const dialog = within(await screen.findByRole("alertdialog"))

  expect(dialog.getByRole("heading")).toHaveTextContent(
    /^Remove ⁨Mariam Fanous⁩’s access to ⁨Anna Fanous⁩\?$/
  )

  await userEvent.dblClick(dialog.getByRole("button", { name: "Remove access" }))
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Access removed."))
  expect(sent).toEqual([{ path: `revoke ${id}`, body: {} }])
  expect(await screen.findByText(/0 links between/)).toBeInTheDocument()
})

test("a link removed meanwhile toasts and refetches", async () => {
  const page = open([link("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7eb401", mariamFanous, anna)], {
    revoke: () => problem(404, "notFound.guardian"),
  })

  await userEvent.click(within((await rows())[0]!).getByRole("button", { name: "Remove" }))
  const dialog = within(await screen.findByRole("alertdialog"))
  await userEvent.click(dialog.getByRole("button", { name: "Remove access" }))

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("This parent link does not exist or was removed.")
  )

  await waitFor(() => expect(page.reads()).toBe(2))
})
