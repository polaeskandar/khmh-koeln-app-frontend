import { screen, within } from "@testing-library/react"
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
      /Family Meeting meets as one group\. Its 0 members belong to the service itself/
    )
  ).toBeInTheDocument()

  expect(await screen.findByText("No schedules yet.")).toBeInTheDocument()
  expect(stat("Stages")).toHaveTextContent("0")
  expect(stat("Members")).toHaveTextContent("0")
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
