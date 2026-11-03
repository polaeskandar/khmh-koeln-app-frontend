import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { ServiceList, ServiceRow } from "@/features/services/api"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { peopleList } from "@test/support/fixtures/people"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { PersonRow } from "@/features/members/api"
import { MembersScreen } from "@/features/members/members-page"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

afterEach(() => vi.restoreAllMocks())

const base = services.items[0]!

const stage = (
  name: string,
  position: number,
  extra: Partial<ServiceRow["stages"][number]> = {}
) => ({
  id: `0192f3a4-7b1c-7d2e-8f3d-${String(position).padStart(12, "0")}`,
  name,
  position,
  archived: false,
  can: { manageMembers: true },
  ...extra,
})

const kindergarten = stage("Kindergarten", 0)
const second = stage("2nd Class", 2)
const third = stage("3rd Class", 3)
const fourth = stage("4th Class", 4, { archived: true })
const fifth = stage("5th Class", 5, { can: { manageMembers: false } })

const sundaySchool: ServiceRow = {
  ...base,
  stages: [kindergarten, second, third, fourth, fifth],
  can: { ...base.can, manageMembers: true },
}

const list: ServiceList = { items: [sundaySchool], can: { create: true } }

const ref = ({ id, name, position, archived }: typeof second) => ({ id, name, position, archived })

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
  can: { edit: true },
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

function open(
  initial: PersonRow,
  move: () => Response = () => HttpResponse.json({ id: "m2" }),
  locale: Locale = "en"
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
    { locale }
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

test("the targets leave out the current, other, archived and unmanaged stages", async () => {
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
  open(lydia([inSecond]), () => problem(403, "people.moveOutsideStages"), "de")
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
    expect(toast.error).toHaveBeenCalledWith(
      "Sie können Personen nur in Stufen verschieben, in denen Sie dienen."
    )
  )
})
