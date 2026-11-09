import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { ServiceList, ServiceRow } from "@/features/organization/services/api"
import type { Me } from "@/features/identity/auth/api"
import type { Locale } from "@/i18n/config"
import type { Schemas } from "@/lib/api/client"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { peopleList } from "@test/support/fixtures/people"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { PersonRow } from "@/features/people/members/api"
import { MembersScreen } from "@/features/people/members/members-page"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)
vi.mock("next/navigation", async () => (await import("@test/support/navigation")).searchParamsMock)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

afterEach(() => vi.restoreAllMocks())

const base = services.items[0]!

const stage = (name: string, position: number): ServiceRow["stages"][number] => ({
  id: `0192f3a4-7b1c-7d2e-8f3d-${String(position).padStart(12, "0")}`,
  name,
  position,
})

const kindergarten = stage("Kindergarten", 0)
const second = stage("2nd Class", 2)
const third = stage("3rd Class", 3)

const sundaySchool: ServiceRow = { ...base, stages: [kindergarten, second, third] }

const list: ServiceList = { items: [sundaySchool] }

const ref = ({ id, name, position }: typeof second) => ({ id, name, position, archived: false })

const removeOnly: Me = {
  ...me.churchOffice,
  permissions: [
    { action: "read", resource: "services" },
    { action: "read", resource: "members" },
    { action: "delete", resource: "members" },
  ],
}

const lydia = (
  placements: PersonRow["placements"],
  past: PersonRow["pastPlacements"] = []
): PersonRow => ({
  person: {
    id: "0192f3a4-7b1c-7d2e-8f3b-00000000a001",
    firstName: "Lydia",
    lastName: "Aziz",
    displayName: null,
    status: "active",
  },
  placements,
  pastPlacements: past,
})

const inSecond = {
  membershipId: "0192f3a4-7b1c-7d2e-8f3c-00000000a001",
  service: {
    id: sundaySchool.id,
    name: sundaySchool.name,
    tone: sundaySchool.tone,
    archived: false,
  },
  stage: ref(second),
  startsOn: "2026-09-06",
  endsOn: null,
}

const moved: Schemas["AddedMembershipResponse"] = {
  id: "m2",
  personId: "0192f3a4-7b1c-7d2e-8f3b-00000000a001",
  service: inSecond.service,
  stage: ref(third),
  startsOn: "2026-11-08",
  endsOn: null,
}

function open(
  initial: PersonRow,
  move: () => Response = () => HttpResponse.json(moved),
  locale: Locale = "en",
  viewer: Me = me.administrator
) {
  let current = initial
  const moves: unknown[] = []

  server.use(
    http.get(apiUrl("/services"), () => HttpResponse.json(list)),
    http.get(apiUrl("/people"), () => HttpResponse.json(peopleList([current]))),
    http.post(apiUrl("/memberships/:id/move"), async ({ request }) => {
      moves.push(await request.json())
      const response = move()

      if (response.ok) {
        current = lydia(
          [{ ...inSecond, membershipId: "m2", stage: ref(third), startsOn: "2026-11-08" }],
          [{ ...inSecond, endsOn: "2026-11-07" }]
        )
      }

      return response
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <MembersScreen />
    </SidebarProvider>,
    { locale, me: viewer }
  )

  return moves
}

async function openMenu() {
  const table = within(await screen.findByRole("table"))
  await userEvent.click(table.getByRole("button", { name: /Lydia Aziz/ }))
  const sheet = within(await screen.findByRole("dialog"))

  await userEvent.click(
    sheet.getByRole("button", { name: "Actions for 2nd Class (Sunday School)" })
  )

  return sheet
}

async function moveTargets() {
  await userEvent.click(await screen.findByRole("menuitem", { name: "Move from today to" }))

  return within(await screen.findByRole("menu", { name: "Move from today to" }))
}

test("moving from 2nd to 3rd Class sends one move and shows the new stage since today", async () => {
  const moves = open(lydia([inSecond]))
  const sheet = await openMenu()
  const targets = await moveTargets()
  await userEvent.click(targets.getByRole("menuitem", { name: "3rd Class" }))

  await waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith("Moved. Past attendance stays with the old stage.")
  )

  expect(moves).toEqual([{ stageId: third.id }])
  expect(await sheet.findByText(/3rd Class/)).toBeInTheDocument()
  expect(await sheet.findByText(/Sun 8 Nov 2026/)).toBeInTheDocument()
})

test("the targets leave out the current stage and the others the person is in", async () => {
  open(
    lydia([
      inSecond,
      {
        ...inSecond,
        membershipId: "0192f3a4-7b1c-7d2e-8f3c-00000000a002",
        stage: ref(kindergarten),
      },
    ])
  )

  await openMenu()
  const targets = await moveTargets()
  expect(targets.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["3rd Class"])
})

test("with no stage left only Remove remains", async () => {
  open(
    lydia([
      inSecond,
      {
        ...inSecond,
        membershipId: "0192f3a4-7b1c-7d2e-8f3c-00000000a002",
        stage: ref(kindergarten),
      },
      { ...inSecond, membershipId: "0192f3a4-7b1c-7d2e-8f3c-00000000a003", stage: ref(third) },
    ])
  )

  await openMenu()
  const menu = within(await screen.findByRole("menu"))

  expect(menu.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
    "Remove from 2nd Class (Sunday School)",
  ])
})

test("without members: update there is no Move, only Remove", async () => {
  open(lydia([inSecond]), undefined, "en", removeOnly)
  await openMenu()
  const menu = within(await screen.findByRole("menu"))

  expect(menu.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
    "Remove from 2nd Class (Sunday School)",
  ])
})

test("without members: update or delete there is no menu", async () => {
  open(lydia([inSecond]), undefined, "en", me.servant)
  const table = within(await screen.findByRole("table"))
  await userEvent.click(table.getByRole("button", { name: /Lydia Aziz/ }))
  const sheet = within(await screen.findByRole("dialog"))
  expect(sheet.getByText("2nd Class (Sunday School)")).toBeInTheDocument()

  expect(
    sheet.queryByRole("button", { name: "Actions for 2nd Class (Sunday School)" })
  ).not.toBeInTheDocument()
})

test("a refusal toasts and leaves the sheet as it was", async () => {
  open(lydia([inSecond]), () =>
    problem(409, "people.alreadyIn", { params: { name: "Lydia Aziz", where: "3rd Class" } })
  )

  const sheet = await openMenu()
  const targets = await moveTargets()
  await userEvent.click(targets.getByRole("menuitem", { name: "3rd Class" }))

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("Lydia Aziz is already in 3rd Class.")
  )

  expect(sheet.getByText(/2nd Class/)).toBeInTheDocument()
})

test("a 422 on the stage is toasted", async () => {
  open(lydia([inSecond]), () =>
    problem(422, "validation.failed", {
      fieldErrors: { stageId: { code: "meetings.stageArchived", params: { name: "3rd Class" } } },
    })
  )

  await openMenu()
  const targets = await moveTargets()
  await userEvent.click(targets.getByRole("menuitem", { name: "3rd Class" }))
  await waitFor(() => expect(toast.error).toHaveBeenCalled())
})

test("in German the 403 reads in German", async () => {
  open(lydia([inSecond]), () => problem(403, "people.changeNotAllowed"), "de")
  const table = within(await screen.findByRole("table"))
  await userEvent.click(table.getByRole("button", { name: /Lydia Aziz/ }))
  const sheet = within(await screen.findByRole("dialog"))

  await userEvent.click(
    sheet.getAllByRole("button").find((b) => b.getAttribute("aria-haspopup") === "menu")!
  )

  await userEvent.click((await screen.findAllByRole("menuitem"))[0]!)
  const targets = await screen.findAllByRole("menuitem", { name: "3rd Class" })
  await userEvent.click(targets[0]!)

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("Sie können keine Personen oder ihre Stufen ändern.")
  )
})
