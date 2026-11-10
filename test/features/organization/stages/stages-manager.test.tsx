import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Me } from "@/features/identity/auth/api"
import type { ServiceStages } from "@/features/organization/services/api"
import type { StageFields } from "@/features/organization/stages/api"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { stageRef } from "@test/support/fixtures/sessions"
import { SUNDAY_SCHOOL_ID, thirdClass } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import { StagesManager } from "@/features/organization/stages/stages-manager"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}))

afterEach(() => {
  vi.restoreAllMocks()
  router.push.mockReset()
})

const service = { id: SUNDAY_SCHOOL_ID, name: "Sunday School", tone: 1, archived: false }

const noImpact = { activeSchedules: 0, upcomingSessions: 0 }

const stagesData = (): ServiceStages => ({
  service,
  stages: [
    { ...stageRef("3rd Class", 2), description: "Ages 8 to 9", memberCount: 14, impact: noImpact },
    { ...stageRef("Kindergarten", 0), description: null, memberCount: 9, impact: noImpact },
    { ...stageRef("1st Class", 1), description: null, memberCount: 11, impact: noImpact },
  ],
  archivedStages: [],
})

function open(data: ServiceStages, write?: () => Response, viewer: Me = me.leader) {
  search.value = `id=${SUNDAY_SCHOOL_ID}`
  const sent: { method: string; body: unknown }[] = []

  server.use(
    http.get(apiUrl(`/services/${SUNDAY_SCHOOL_ID}/stages`), () => HttpResponse.json(data)),
    http.post(apiUrl(`/services/${SUNDAY_SCHOOL_ID}/stages`), async ({ request }) => {
      sent.push({ method: "POST", body: await request.json() })

      return (
        write?.() ??
        HttpResponse.json(
          { ...thirdClass, id: "0192f3a4-7b1c-7d2e-8f3a-0000000000a5", name: "4th Class" },
          { status: 201 }
        )
      )
    }),
    http.put(apiUrl("/stages/:id"), async ({ request }) => {
      const body = (await request.json()) as StageFields
      sent.push({ method: "PUT", body })

      return write?.() ?? HttpResponse.json({ ...thirdClass, ...body })
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <StagesManager />
    </SidebarProvider>,
    { me: viewer }
  )

  return sent
}

const dialog = () => within(screen.getByRole("dialog"))

test("rows follow position with member counts and links", async () => {
  open(stagesData())

  expect(
    await screen.findByRole("heading", { level: 1, name: "Stages of Sunday School" })
  ).toBeInTheDocument()

  const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1)

  expect(rows.map((row) => row.textContent)).toEqual([
    expect.stringMatching(/^1Kindergarten9/),
    expect.stringMatching(/^21st Class11/),
    expect.stringMatching(/^33rd ClassAges 8 to 914/),
  ])

  expect(within(rows[2]).getByRole("link", { name: "3rd Class" })).toHaveAttribute(
    "href",
    `/stages/view/?id=${stageRef("3rd Class", 2).id}`
  )
})

test("Rename pre-fills the dialog and sends the whole stage with a PUT", async () => {
  const sent = open(stagesData())
  await userEvent.click(await screen.findByRole("button", { name: "Actions for 3rd Class" }))
  await userEvent.click(screen.getByRole("menuitem", { name: "Rename" }))
  expect(dialog().getByLabelText("Name")).toHaveValue("3rd Class")
  await userEvent.clear(dialog().getByLabelText("Name"))
  await userEvent.type(dialog().getByLabelText("Name"), "Third Class")
  await userEvent.click(dialog().getByRole("button", { name: "Save changes" }))

  await waitFor(() =>
    expect(sent).toEqual([
      { method: "PUT", body: { name: "Third Class", description: "Ages 8 to 9" } },
    ])
  )
})

test("adding sends a POST and opens the new stage; nameTaken shows under Name", async () => {
  let answer: (() => Response) | undefined = () =>
    problem(422, "checkFields", {
      fieldErrors: { name: { code: "stages.nameTaken", params: { name: "3rd Class" } } },
    })

  const sent = open(stagesData(), () => answer!())
  await userEvent.click(await screen.findByRole("button", { name: "Add stage" }))
  await userEvent.type(dialog().getByLabelText("Name"), "3rd Class")
  await userEvent.click(dialog().getByRole("button", { name: "Add stage" }))

  await waitFor(() =>
    expect(dialog().getByLabelText("Name")).toHaveAccessibleDescription(
      "This service already has a stage called “3rd Class”."
    )
  )

  answer = () =>
    HttpResponse.json(
      { ...thirdClass, id: "0192f3a4-7b1c-7d2e-8f3a-0000000000a5", name: "4th Class" },
      { status: 201 }
    )

  await userEvent.clear(dialog().getByLabelText("Name"))
  await userEvent.type(dialog().getByLabelText("Name"), "4th Class")
  await userEvent.click(dialog().getByRole("button", { name: "Add stage" }))

  await waitFor(() =>
    expect(router.push).toHaveBeenCalledWith(
      "/stages/view/?id=0192f3a4-7b1c-7d2e-8f3a-0000000000a5"
    )
  )

  expect(sent.at(-1)).toEqual({ method: "POST", body: { name: "4th Class", description: null } })
})

test("409 archivedNoStageChanges keeps the dialog open", async () => {
  open(stagesData(), () =>
    problem(409, "services.archivedNoStageChanges", { params: { name: "Sunday School" } })
  )

  await userEvent.click(await screen.findByRole("button", { name: "Add stage" }))
  await userEvent.type(dialog().getByLabelText("Name"), "4th Class")
  await userEvent.click(dialog().getByRole("button", { name: "Add stage" }))
  expect(await dialog().findByRole("alert")).toBeInTheDocument()
  expect(screen.getByRole("dialog")).toBeInTheDocument()
})

test("without stages: update there is no Add stage and no menu", async () => {
  open(stagesData(), undefined, me.servant)
  await screen.findByRole("table")
  expect(screen.queryByRole("button", { name: "Add stage" })).toBeNull()
  expect(screen.queryByRole("button", { name: /^Actions for/ })).toBeNull()
})

test("with stages: delete the menu offers Delete", async () => {
  open(stagesData())
  await userEvent.click(await screen.findByRole("button", { name: "Actions for 3rd Class" }))

  expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument()
})

test("without stages: delete the menu offers the other actions but no Delete", async () => {
  const withoutDelete: Me = {
    ...me.leader,
    permissions: me.leader.permissions.filter(
      (permission) => !(permission.resource === "stages" && permission.action === "delete")
    ),
  }

  open(stagesData(), undefined, withoutDelete)
  await userEvent.click(await screen.findByRole("button", { name: "Actions for 3rd Class" }))

  expect(screen.getByRole("menuitem", { name: "Rename" })).toBeInTheDocument()
  expect(screen.getByRole("menuitem", { name: "Archive" })).toBeInTheDocument()
  expect(screen.queryByRole("menuitem", { name: "Delete" })).toBeNull()
})

test("an unknown id shows not found", async () => {
  search.value = `id=${SUNDAY_SCHOOL_ID}`

  server.use(
    http.get(apiUrl(`/services/${SUNDAY_SCHOOL_ID}/stages`), () => problem(404, "notFound.service"))
  )

  renderWithProviders(
    <SidebarProvider>
      <StagesManager />
    </SidebarProvider>,
    { me: me.leader }
  )

  expect(await screen.findByText("This page doesn’t exist")).toBeInTheDocument()
})
