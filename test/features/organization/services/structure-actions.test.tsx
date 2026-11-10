import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { StagesManager } from "@/features/organization/stages/stages-manager"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { insightsOf, services } from "@test/support/fixtures/services"
import { stageRef } from "@test/support/fixtures/sessions"
import { SUNDAY_SCHOOL_ID } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import { address, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { Me } from "@/features/identity/auth/api"
import {
  type Impact,
  serviceInsightsQuery,
  type ServiceRow,
  type ServiceStages,
} from "@/features/organization/services/api"
import { ServiceDetails } from "@/features/organization/services/service-details"
import { ServiceActionsMenu } from "@/features/organization/services/service-dialogs"
import type { Stage } from "@/features/organization/stages/api"

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
})

const [, youth, choir] = services.items as [ServiceRow, ServiceRow, ServiceRow]

function menu(
  service: ServiceRow,
  viewer: Me = me.administrator,
  impact: Impact = { activeSchedules: 0, upcomingSessions: 0 }
) {
  server.use(
    http.get(apiUrl("/services/insights"), () =>
      HttpResponse.json(insightsOf(services.items, { [service.id]: { impact } }))
    )
  )

  return renderWithProviders(<ServiceActionsMenu service={service} />, { me: viewer })
}

const items = async (name: string) => {
  await userEvent.click(screen.getByRole("button", { name: `Actions for ${name}` }))

  return within(await screen.findByRole("menu"))
    .getAllByRole("menuitem")
    .map((item) => item.textContent)
}

test("an administrator may archive and delete a service", async () => {
  menu(youth)
  expect(await items("Youth Meeting")).toEqual(["Edit name and description", "Archive", "Delete"])
})

test("a leader may only edit", async () => {
  menu(youth, me.leader)
  expect(await items("Youth Meeting")).toEqual(["Edit name and description"])
})

test("a servant gets no menu", () => {
  menu(youth, me.servant)

  expect(
    screen.queryByRole("button", { name: "Actions for Youth Meeting" })
  ).not.toBeInTheDocument()
})

test("an archived service offers Restore", async () => {
  menu(choir)
  expect(await items("Choir")).toEqual(["Restore", "Delete"])
})

test("the archive dialog lists the impact, and a refusal stays in it", async () => {
  const posts: unknown[] = []

  server.use(
    http.post(apiUrl(`/services/${youth.id}/archive`), async ({ request }) => {
      posts.push(await request.json())

      return problem(409, "services.takingAttendance", { params: { name: "Youth Meeting" } })
    })
  )

  const { client } = menu(youth, me.administrator, { activeSchedules: 1, upcomingSessions: 2 })

  await vi.waitFor(() =>
    expect(client.getQueryState(serviceInsightsQuery.queryKey)?.status).toBe("success")
  )

  await items("Youth Meeting")
  await userEvent.click(screen.getByRole("menuitem", { name: "Archive" }))
  const dialog = within(await screen.findByRole("alertdialog"))

  expect(
    dialog.getByText("No new sessions are created for its 1 active schedule.")
  ).toBeInTheDocument()

  expect(
    dialog.getByText(/2 sessions already created for the coming days stay/)
  ).toBeInTheDocument()

  await userEvent.click(dialog.getByRole("button", { name: "Archive" }))

  expect(
    await dialog.findByText(
      "Youth Meeting is taking attendance right now. Close the open sessions first."
    )
  ).toBeInTheDocument()

  expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  expect(posts).toEqual([{}])
})

test("deleting a service sends one DELETE and returns to the overview", async () => {
  let deletes = 0

  server.use(
    http.delete(apiUrl(`/services/${choir.id}`), () => {
      deletes++

      return new HttpResponse(null, { status: 204 })
    })
  )

  menu(choir)
  await items("Choir")
  await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
  const dialog = within(await screen.findByRole("alertdialog"))
  await userEvent.dblClick(dialog.getByRole("button", { name: "Delete" }))
  await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/services/"))
  expect(deletes).toBe(1)
})

test("a service with history can't be deleted, and says so in the dialog", async () => {
  server.use(
    http.delete(apiUrl(`/services/${choir.id}`), () =>
      problem(409, "services.hasHistory", { params: { name: "Choir", count: 4 } })
    )
  )

  menu(choir)
  await items("Choir")
  await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }))
  const dialog = within(await screen.findByRole("alertdialog"))
  await userEvent.click(dialog.getByRole("button", { name: "Delete" }))

  expect(
    await dialog.findByText(
      "Choir has meeting history (4 sessions). Archive it instead of deleting it."
    )
  ).toBeInTheDocument()

  expect(router.push).not.toHaveBeenCalled()
})

test("an archived service's details show when and why", async () => {
  const archived = choir
  address.set(`id=${archived.id}`)

  const archivedStages: ServiceStages = {
    service: { id: archived.id, name: archived.name, tone: archived.tone, archived: true },
    stages: [],
    archivedStages: [
      {
        id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef901",
        name: "Altos",
        archivedAt: "2026-09-05T22:30:00Z",
        impact: { activeSchedules: 0, upcomingSessions: 0 },
      },
    ],
  }

  server.use(
    http.get(apiUrl(`/services/${archived.id}`), () => HttpResponse.json(archived)),
    http.get(apiUrl(`/services/${archived.id}/stages`), () => HttpResponse.json(archivedStages)),
    http.get(apiUrl("/services/insights"), () => HttpResponse.json(insightsOf(services.items))),
    http.get(apiUrl("/schedules"), () => HttpResponse.json({ today: "2026-11-08", items: [] }))
  )

  renderWithProviders(
    <SidebarProvider>
      <ServiceDetails />
    </SidebarProvider>,
    { me: me.administrator }
  )

  expect(await screen.findByText("Archived on Sun 6 Sep 2026")).toBeInTheDocument()

  expect(
    screen.getByText(/No new sessions are created for this service\. Its stages, members/)
  ).toBeInTheDocument()

  expect(await screen.findByText(/Archived: Altos\./)).toBeInTheDocument()
})

test("a leader's archived stage moves to Archived stages, and Restore puts it last", async () => {
  const impact = { activeSchedules: 0, upcomingSessions: 0 }
  const third = { ...stageRef("3rd Class", 2), description: null, memberCount: 14, impact }
  const service = { id: SUNDAY_SCHOOL_ID, name: "Sunday School", tone: 1, archived: false }

  const stageOf = (stage: typeof third, archived: boolean): Stage => ({
    id: stage.id,
    name: stage.name,
    description: stage.description,
    position: stage.position,
    archived,
    memberCount: stage.memberCount,
    service,
  })

  let state: "active" | "archived" | "restored" = "active"

  const data = (): ServiceStages => ({
    service,
    stages: [
      { ...stageRef("Kindergarten", 0), description: null, memberCount: 9, impact },
      { ...stageRef("1st Class", 1), description: null, memberCount: 11, impact },
      ...(state === "active" ? [third] : state === "restored" ? [{ ...third, position: 3 }] : []),
    ],
    archivedStages:
      state === "archived"
        ? [{ id: third.id, name: third.name, archivedAt: "2026-11-08T11:00:00Z", impact }]
        : [],
  })

  address.set(`id=${SUNDAY_SCHOOL_ID}`)

  server.use(
    http.get(apiUrl(`/services/${SUNDAY_SCHOOL_ID}/stages`), () => HttpResponse.json(data())),
    http.post(apiUrl(`/stages/${third.id}/archive`), () => {
      state = "archived"

      return HttpResponse.json(stageOf(third, true))
    }),
    http.post(apiUrl(`/stages/${third.id}/restore`), () => {
      state = "restored"

      return HttpResponse.json(stageOf({ ...third, position: 3 }, false))
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <StagesManager />
    </SidebarProvider>,
    { me: me.leader }
  )

  await userEvent.click(await screen.findByRole("button", { name: "Actions for 3rd Class" }))
  await userEvent.click(await screen.findByRole("menuitem", { name: "Archive" }))
  const dialog = within(await screen.findByRole("alertdialog"))

  expect(
    dialog.getByText("14 people stay assigned to it; move them to another stage if they continue.")
  ).toBeInTheDocument()

  await userEvent.click(dialog.getByRole("button", { name: "Archive" }))
  const archived = await screen.findByRole("heading", { name: "Archived stages" })
  const section = within(archived.closest("section")!)
  expect(section.getByText("Archived on Sun 8 Nov 2026")).toBeInTheDocument()
  await userEvent.click(section.getByRole("button", { name: "Restore" }))

  await userEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Restore" })
  )

  await vi.waitFor(() =>
    expect(screen.queryByRole("heading", { name: "Archived stages" })).not.toBeInTheDocument()
  )

  const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1)
  expect(rows.at(-1)).toHaveTextContent("3rd Class")
})
