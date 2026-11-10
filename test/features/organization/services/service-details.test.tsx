import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { schedule } from "@test/support/fixtures/schedules"
import { insightsOf, services } from "@test/support/fixtures/services"
import { stageRef } from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { StaffAccount } from "@/features/identity/accounts/api"
import type { Me } from "@/features/identity/auth/api"
import type { ServiceRow, ServiceStages } from "@/features/organization/services/api"
import { ServiceDetails } from "@/features/organization/services/service-details"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}))

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

const staffAccount = (
  n: number,
  displayName: string,
  assignments: StaffAccount["assignments"]
): StaffAccount => ({
  id: `0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef${String(n).padStart(3, "0")}`,
  displayName,
  email: `${displayName.split(" ")[0]!.toLowerCase()}@example.org`,
  disabled: false,
  roles: [],
  assignments,
})

const staff: StaffAccount[] = [
  staffAccount(1, "Christine Adel", [
    { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea001", service: ref(sundaySchool), stage: null },
  ]),
  staffAccount(2, "Daniel Mikhail", [
    {
      id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea002",
      service: ref(sundaySchool),
      stage: stageRef("3rd Class", 3),
    },
  ]),
  staffAccount(3, "Mina Girgis", [
    { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea003", service: ref(familyMeeting), stage: null },
  ]),
  staffAccount(4, "Rebecca Girgis", []),
]

const assigned: string[] = []

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
  search.value = `id=${service.id}`
  const scheduleRequests: string[] = []

  server.use(
    http.get(apiUrl("/staff-accounts"), () =>
      HttpResponse.json({ today: "2026-11-08", items: staff })
    ),
    http.post(apiUrl("/accounts/:id/assignments"), async ({ params, request }) => {
      const body = (await request.json()) as { serviceId: string; stageId: string | null }
      assigned.push(`${params.id} ${body.serviceId} ${body.stageId}`)

      return HttpResponse.json(
        {
          id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ea099",
          service: ref(sundaySchool),
          stage: stageRef("3rd Class", 3),
        },
        { status: 201 }
      )
    }),
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

  renderWithProviders(
    <SidebarProvider>
      <ServiceDetails />
    </SidebarProvider>,
    { me: viewer }
  )

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

test("Servants lists who serves in the service and its stages, and Assign adds one", async () => {
  assigned.length = 0
  open(sundaySchool, STAGES, 0)
  const section = (await screen.findByRole("heading", { name: "Servants" })).closest("section")!
  const servants = within(section)
  const christine = (await servants.findByText("Christine Adel")).closest("li")!
  expect(christine).toHaveTextContent("The whole service")
  expect(servants.getByText("Daniel Mikhail").closest("li")).toHaveTextContent("3rd Class")
  expect(servants.queryByText("Mina Girgis")).toBeNull()
  expect(servants.queryByText("Rebecca Girgis")).toBeNull()
  await userEvent.click(servants.getByRole("button", { name: "Assign" }))
  const dialog = within(await screen.findByRole("dialog"))
  expect(dialog.getByText("Assign a servant to ⁨Sunday School⁩")).toBeInTheDocument()
  expect(dialog.queryByRole("combobox", { name: "Service" })).toBeNull()
  await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Account" }), staff[3]!.id)
  await userEvent.selectOptions(dialog.getByRole("combobox", { name: "Stage" }), "3rd Class")
  await userEvent.click(dialog.getByRole("button", { name: "Assign" }))

  await waitFor(() =>
    expect(assigned).toEqual([`${staff[3]!.id} ${sundaySchool.id} ${stageRef("3rd Class", 3).id}`])
  )
})

test("a leader without users: read sees no Servants", async () => {
  open(sundaySchool, STAGES, 0, me.leader)
  await screen.findByRole("heading", { level: 1, name: "Sunday School" })
  expect(screen.queryByRole("heading", { name: "Servants" })).toBeNull()
})

test("who may read accounts but not assign sees the servants without Assign or Take out", async () => {
  open(sundaySchool, STAGES, 0, me.churchOffice)

  const section = (await screen.findByRole("heading", { name: "Servants" })).closest("section")!
  expect(await within(section).findByText("Christine Adel")).toBeInTheDocument()
  expect(within(section).queryByRole("button", { name: "Assign" })).toBeNull()
  expect(within(section).queryByRole("button", { name: /^Take / })).toBeNull()
})

test("an unknown id shows not found", async () => {
  const id = "0192f3a4-7b1c-7d2e-8f3a-00000000dead"
  search.value = `id=${id}`
  server.use(http.get(apiUrl(`/services/${id}`), () => problem(404, "notFound.service")))

  renderWithProviders(
    <SidebarProvider>
      <ServiceDetails />
    </SidebarProvider>,
    { me: me.administrator }
  )

  expect(await screen.findByText("This page doesn’t exist")).toBeInTheDocument()
})
