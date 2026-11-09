import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Locale } from "@/i18n/config"
import { apiUrl } from "@test/support/api"
import { peopleList, person } from "@test/support/fixtures/people"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { PersonRow } from "@/features/people/members/api"
import { MembersScreen } from "@/features/people/members/members-page"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
})

afterEach(() => vi.restoreAllMocks())

function open(initial: PersonRow, locale: Locale = "en") {
  let current = initial
  const sent: { path: string; body: unknown }[] = []

  server.use(
    http.get(apiUrl("/services"), () => HttpResponse.json(services)),
    http.get(apiUrl("/people"), () => HttpResponse.json(peopleList(current ? [current] : []))),
    http.patch(apiUrl(`/people/${initial.person.id}`), async ({ request }) => {
      const body = (await request.json()) as Partial<PersonRow["person"]>
      sent.push({ path: "patch", body })
      current = { ...current, person: { ...current.person, ...body } }

      return HttpResponse.json(current.person)
    }),
    http.post(apiUrl("/memberships/:id/end"), ({ params }) => {
      sent.push({ path: `end ${params.id}`, body: null })
      const ended = current.placements.find((p) => p.membershipId === params.id)!

      current = {
        ...current,
        placements: current.placements.filter((p) => p.membershipId !== params.id),
        pastPlacements: [...current.pastPlacements, { ...ended, endsOn: "2026-11-07" }],
      }

      return new HttpResponse(null, { status: 204 })
    }),
    http.post(apiUrl(`/people/${initial.person.id}/memberships`), async ({ request }) => {
      sent.push({ path: "join", body: await request.json() })

      return HttpResponse.json({ id: "m-new" }, { status: 201 })
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <MembersScreen />
    </SidebarProvider>,
    { locale }
  )

  return sent
}

const openSheet = async (name: string) => {
  const table = within(await screen.findByRole("table"))
  await userEvent.click(table.getByRole("button", { name: new RegExp(name) }))

  return within(await screen.findByRole("dialog"))
}

test("a corrected name toasts Saved. and appears in the row", async () => {
  const sent = open(person("Mina", "Hana"))
  const sheet = await openSheet("Mina Hana")
  expect(sheet.queryByRole("button", { name: "Save name" })).toBeNull()
  await userEvent.clear(sheet.getByLabelText("Last name"))
  await userEvent.type(sheet.getByLabelText("Last name"), "Hanna")
  await userEvent.click(sheet.getByRole("button", { name: "Save name" }))
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Saved."))
  expect(sent).toEqual([{ path: "patch", body: { lastName: "Hanna" } }])

  expect(
    await within(screen.getByRole("table", { hidden: true })).findByText("Mina Hanna")
  ).toBeInTheDocument()
})

test("without can.edit there is no name form or Add to", async () => {
  open({ ...person("Mina", "Hanna"), can: { edit: false } })
  const sheet = await openSheet("Mina Hanna")
  expect(sheet.queryByLabelText("First name")).toBeNull()
  expect(sheet.queryByRole("combobox", { name: "Add to" })).toBeNull()
})

test("Remove ends the membership once after confirming and moves it under Earlier", async () => {
  const mina = person("Mina", "Hanna")
  const sent = open(mina)
  const sheet = await openSheet("Mina Hanna")

  await userEvent.click(
    sheet.getByRole("button", { name: "Actions for 3rd Class (Sunday School)" })
  )

  await userEvent.click(
    await screen.findByRole("menuitem", { name: "Remove from 3rd Class (Sunday School)" })
  )

  const confirm = within(screen.getByRole("alertdialog"))
  await userEvent.click(confirm.getByRole("button", { name: "Remove" }))

  await waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith("Removed. Past attendance is kept.")
  )

  expect(sent).toEqual([{ path: `end ${mina.placements[0].membershipId}`, body: null }])
  const refreshed = within(await screen.findByRole("dialog"))
  expect(await refreshed.findByText("No service at the moment.")).toBeInTheDocument()

  expect(
    refreshed.getByText(/3rd Class \(Sunday School\), Sun 6 Sep 2026 to Sat 7 Nov 2026/)
  ).toBeInTheDocument()
})

test("Add to offers only managed placements the person lacks", async () => {
  const sundaySchool = services.items[0]
  const third = sundaySchool.stages.find((stage) => stage.name === "3rd Class")!
  const mina = person("Mina", "Hanna")

  const sent = open({
    ...mina,
    placements: [
      {
        ...mina.placements[0],
        service: { id: sundaySchool.id, name: sundaySchool.name, tone: 1, archived: false },
        stage: { id: third.id, name: third.name, position: third.position, archived: false },
      },
    ],
  })

  const sheet = await openSheet("Mina Hanna")
  const select = sheet.getByRole("combobox", { name: "Add to" })

  const offered = within(select)
    .getAllByRole("option")
    .map((option) => option.textContent)

  expect(offered).not.toContain("Sunday School · 3rd Class")
  expect(offered).toContain("Sunday School · 1st Class")
  await userEvent.selectOptions(select, "Sunday School · 1st Class")
  await userEvent.click(sheet.getByRole("button", { name: "Add" }))
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Added."))
  const firstClass = services.items[0].stages.find((stage) => stage.name === "1st Class")!

  expect(sent).toEqual([
    { path: "join", body: { serviceId: services.items[0].id, stageId: firstClass.id } },
  ])
})

test("in Arabic the sheet opens from the left", async () => {
  open(person("Mina", "Hanna"), "ar")
  await openSheet("Mina Hanna")
  expect(document.querySelector("[data-slot='sheet-content']")).toHaveAttribute("data-side", "left")
})
