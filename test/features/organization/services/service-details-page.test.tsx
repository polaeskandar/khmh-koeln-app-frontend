import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, expect, test } from "vitest"

import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { schedule } from "@test/support/fixtures/schedules"
import { insightsOf, services } from "@test/support/fixtures/services"
import { stageRef } from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { address } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { Me } from "@/features/identity/auth/api"
import type {
  ServantAccount,
  ServiceRow,
  ServiceServant,
  ServiceStages,
} from "@/features/organization/services/api"
import { ServiceDetailsPage } from "@/features/organization/services/service-details-page"

const STAGES = ["Kindergarten", "1st Class", "2nd Class", "3rd Class", "4th Class", "5th Class"]

const sundaySchool: ServiceRow = {
  ...services.items[0],
  memberCount: 72,
  serviceLevelMemberCount: 0,
}

const familyMeeting: ServiceRow = {
  ...services.items.find((s) => s.name === "Family Meeting")!,
  memberCount: 0,
  serviceLevelMemberCount: 0,
}

const ref = ({ id, name, tone }: ServiceRow) => ({ id, name, tone, archived: false })

const account = (n: number, name: string): ServantAccount => ({
  id: `0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef${String(n).padStart(3, "0")}`,
  name,
})

const CHRISTINE = account(1, "Christine Adel")
const DANIEL = account(2, "Daniel Mikhail")
const REBECCA = account(4, "Rebecca Girgis")

const assignment = (n: number) => `0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea${String(n).padStart(3, "0")}`

const SERVANTS: ServiceServant[] = [
  { assignmentId: assignment(1), account: CHRISTINE, stage: null },
  { assignmentId: assignment(2), account: DANIEL, stage: stageRef("3rd Class", 3) },
  { assignmentId: assignment(3), account: DANIEL, stage: stageRef("4th Class", 4) },
]

let servants: ServiceServant[] = []
const sent: string[] = []

beforeEach(() => {
  servants = [...SERVANTS]
  sent.length = 0
})

const stagesOf = (service: ServiceRow, names: string[]): ServiceStages => ({
  service: { id: service.id, name: service.name, tone: service.tone, archived: false },
  stages: names
    .map((name, position) => ({
      ...stageRef(name, position),
      description: null,
      memberCount: 12,
      impact: { activeSchedules: 0, upcomingSessions: 0 },
    }))
    .reverse(),
  archivedStages: [],
})

function open(
  service: ServiceRow,
  names: string[],
  scheduleCount: number,
  viewer: Me = me.administrator
) {
  address.set(`id=${service.id}`)
  const scheduleRequests: string[] = []

  server.use(
    http.get(apiUrl(`/services/${service.id}/servants`), () => {
      sent.push("list")

      return HttpResponse.json({ servants, assignable: [CHRISTINE, DANIEL, REBECCA] })
    }),
    http.post(apiUrl("/accounts/:id/assignments"), async ({ params, request }) => {
      const body = (await request.json()) as { serviceId: string; stageId: string | null }
      sent.push(`assign ${params.id} ${body.serviceId} ${body.stageId}`)
      const stage = stageRef("3rd Class", 3)
      const assigned = [CHRISTINE, DANIEL, REBECCA].find((option) => option.id === params.id)!
      servants = [...servants, { assignmentId: assignment(99), account: assigned, stage }]

      return HttpResponse.json(
        { id: assignment(99), service: ref(sundaySchool), stage },
        { status: 201 }
      )
    }),
    http.delete(apiUrl("/assignments/:id"), ({ params }) => {
      sent.push(`unassign ${params.id}`)
      servants = servants.filter((servant) => servant.assignmentId !== params.id)

      return new HttpResponse(null, { status: 204 })
    }),
    http.get(apiUrl("/me"), () => HttpResponse.json(viewer)),
    http.get(apiUrl("/services"), () => HttpResponse.json(services)),
    http.get(apiUrl(`/services/${service.id}`), () => HttpResponse.json(service)),
    http.get(apiUrl(`/services/${service.id}/stages`), () =>
      HttpResponse.json(stagesOf(service, names))
    ),
    http.get(apiUrl("/services/insights"), () => HttpResponse.json(insightsOf([service]))),
    http.get(apiUrl("/schedules"), ({ request }) => {
      scheduleRequests.push(new URL(request.url).searchParams.get("serviceId") ?? "")

      const items = Array.from({ length: scheduleCount }, (_, i) =>
        schedule({ name: `Schedule ${i}`, active: i < 6 })
      )

      return HttpResponse.json({ today: "2026-11-08", items })
    })
  )

  renderWithProviders(<ServiceDetailsPage />, { me: viewer, sidebar: true })

  return scheduleRequests
}

const stat = (label: string) => screen.getByText(label, { selector: "span" }).parentElement!

test("Sunday School shows 6 / 72 / 6 and its stages in position order", async () => {
  const requests = open(sundaySchool, STAGES, 7)
  const heading = await screen.findByRole("heading", { name: "Stages", level: 2 })

  const stageLinks = within(heading.closest("section")!)
    .getAllByRole("link")
    .filter((link) => link.getAttribute("href")?.startsWith("/stages/view/"))

  expect(stageLinks.map((link) => link.textContent)).toEqual(
    STAGES.map((name) => `${name}12 members`)
  )

  expect(await screen.findByText(/Schedule 6/)).toBeInTheDocument()
  expect(stat("Stages")).toHaveTextContent("6")
  expect(stat("Members")).toHaveTextContent("72")
  expect(stat("Active schedules")).toHaveTextContent("6")
  expect(requests).toEqual([sundaySchool.id])
})

test("Family Meeting meets as one group and has no schedules", async () => {
  open(familyMeeting, [], 0)

  expect(
    await screen.findByText(
      "Family Meeting meets as one group. It has no members yet. Add stages if it splits into classes or levels."
    )
  ).toBeInTheDocument()

  expect(screen.queryByText(/0 members/)).toBeNull()
  expect(await screen.findByText("No schedules yet.")).toBeInTheDocument()
  expect(stat("Stages")).toHaveTextContent("0")
  expect(stat("Members")).toHaveTextContent("0")
})

test("a service without stages counts the members that belong to it", async () => {
  open({ ...familyMeeting, memberCount: 1, serviceLevelMemberCount: 1 }, [], 0)

  expect(
    await screen.findByText(
      /Family Meeting meets as one group\. Its 1 member belongs to the service itself\./
    )
  ).toBeInTheDocument()
})

test("Edit opens the pre-filled dialog when allowed, and is absent otherwise", async () => {
  open(sundaySchool, STAGES, 1)
  await userEvent.click(await screen.findByRole("button", { name: "Edit" }))
  expect(within(screen.getByRole("dialog")).getByLabelText("Name")).toHaveValue("Sunday School")
})

test("a servant sees no Edit", async () => {
  open(familyMeeting, [], 0, me.servant)
  await screen.findByRole("heading", { level: 1, name: "Family Meeting" })
  expect(screen.queryByRole("button", { name: "Edit" })).toBeNull()
})

const servantsSection = async () =>
  within((await screen.findByRole("heading", { name: "Servants" })).closest("section")!)

test("Servants lists each servant with their groups, and Assign adds one", async () => {
  open(sundaySchool, STAGES, 0)
  const section = await servantsSection()
  const christine = (await section.findByText("Christine Adel")).closest("li")!
  expect(christine).toHaveTextContent("The whole service")
  expect(section.getByText("Daniel Mikhail").closest("li")).toHaveTextContent("3rd Class4th Class")
  expect(section.queryByText("Rebecca Girgis")).toBeNull()
  await userEvent.click(section.getByRole("button", { name: "Assign" }))
  const dialog = within(await screen.findByRole("dialog"))
  expect(dialog.getByText("Assign a servant to ⁨Sunday School⁩")).toBeInTheDocument()
  expect(dialog.queryByRole("combobox", { name: "Service" })).toBeNull()

  expect(dialog.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "Choose an account",
    "Christine Adel",
    "Daniel Mikhail",
    "Rebecca Girgis",
    "The whole service",
    ...STAGES,
  ])

  await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Account" }), REBECCA.id)
  await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Stage" }), "3rd Class")
  await userEvent.click(dialog.getByRole("button", { name: "Assign" }))
  expect((await section.findByText("Rebecca Girgis")).closest("li")).toHaveTextContent("3rd Class")

  expect(sent).toEqual([
    "list",
    `assign ${REBECCA.id} ${sundaySchool.id} ${stageRef("3rd Class", 3).id}`,
    "list",
  ])
})

test("a service leader without users: read sees the servants and takes one out", async () => {
  open(sundaySchool, STAGES, 0, me.leader)
  const section = await servantsSection()
  expect(await section.findByRole("button", { name: "Assign" })).toBeInTheDocument()

  await userEvent.click(
    await section.findByRole("button", {
      name: "Take Daniel Mikhail out of Sunday School · 3rd Class",
    })
  )

  await userEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Take out" })
  )

  await waitFor(() =>
    expect(section.getByText("Daniel Mikhail").closest("li")).not.toHaveTextContent("3rd Class")
  )

  expect(sent).toEqual(["list", `unassign ${assignment(2)}`, "list"])
})

test("an archived service lists its servants without Assign", async () => {
  open({ ...sundaySchool, archived: true, archivedAt: "2026-10-01T10:00:00Z" }, STAGES, 0)
  const section = await servantsSection()
  expect(await section.findByText("Christine Adel")).toBeInTheDocument()
  expect(section.queryByRole("button", { name: "Assign" })).toBeNull()
})

test.each([
  ["a servant", me.servant],
  ["the church office, who reads accounts", me.churchOffice],
])("%s, who may not assign in the service, sees no Servants", async (_, viewer) => {
  open(sundaySchool, STAGES, 0, viewer)
  await screen.findByRole("heading", { level: 1, name: "Sunday School" })
  await screen.findByRole("heading", { name: "Meeting schedules" })
  expect(screen.queryByRole("heading", { name: "Servants" })).toBeNull()
  expect(sent).toEqual([])
})

test("an unknown id shows not found", async () => {
  const id = "0192f3a4-7b1c-7d2e-8f3a-00000000dead"
  address.set(`id=${id}`)
  server.use(http.get(apiUrl(`/services/${id}`), () => problem(404, "notFound.service")))

  renderWithProviders(<ServiceDetailsPage />, { me: me.administrator, sidebar: true })

  expect(await screen.findByText("This page doesn’t exist")).toBeInTheDocument()
})
