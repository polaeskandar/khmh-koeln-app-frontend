import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { ServiceList } from "@/features/services/api"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { peopleList } from "@test/support/fixtures/people"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import { MembersScreen } from "@/features/members/members-page"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

afterEach(() => vi.restoreAllMocks())

const sundaySchool = services.items[0]
const thirdClassId = sundaySchool.stages.find((stage) => stage.name === "3rd Class")!.id

const servantServices: ServiceList = {
  ...services,
  items: services.items.map((service) => ({
    ...service,
    can: { ...service.can, manageMembers: false },
    stages: service.stages.map((stage) => ({
      ...stage,
      can: { manageMembers: stage.id === thirdClassId },
    })),
  })),
}

const mina = {
  id: "0192f3a4-7b1c-7d2e-8f60-000000000001",
  firstName: "Mina",
  lastName: "Hanna",
  displayName: null,
  groups: [{ service: { id: "y", name: "Youth Meeting", tone: 2, archived: false }, stage: null }],
}

function open({
  list = services,
  create = () =>
    HttpResponse.json(
      {
        person: { id: "p1", firstName: "Mina", lastName: "Hanna", displayName: null },
        membership: { id: "m1" },
      },
      { status: 201 }
    ),
  join = (): Response | Promise<Response> => HttpResponse.json({ id: "m2" }, { status: 201 }),
  locale = "en" as Locale,
} = {}) {
  const sent: { path: string; body: Record<string, unknown> }[] = []

  server.use(
    http.get(apiUrl("/services"), () => HttpResponse.json(list)),
    http.get(apiUrl("/people"), () => HttpResponse.json(peopleList([]))),
    http.post(apiUrl("/people"), async ({ request }) => {
      sent.push({ path: "/people", body: (await request.json()) as Record<string, unknown> })

      return create()
    }),
    http.post(apiUrl("/people/:id/memberships"), async ({ request, params }) => {
      sent.push({
        path: `/people/${params.id}/memberships`,
        body: (await request.json()) as Record<string, unknown>,
      })

      return join()
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

const openDialog = async (name = "Add person") => {
  await userEvent.click(await screen.findByRole("button", { name }))

  return within(await screen.findByRole("dialog"))
}

const options = (dialog: { getAllByRole: (role: "option") => HTMLElement[] }, name: string) =>
  dialog
    .getAllByRole("option")
    .filter((option) => option.closest("select")?.id === name)
    .map((option) => option.textContent)

describe("placements", () => {
  test("a 3rd Class servant sees Sunday School with only 3rd Class and no No stage", async () => {
    open({ list: servantServices })
    const dialog = await openDialog()
    expect(options(dialog, "person-service")).toEqual(["Sunday School"])
    expect(options(dialog, "person-stage")).toEqual(["3rd Class"])
  })

  test("a leader sees No stage and every stage", async () => {
    open()
    const dialog = await openDialog()

    expect(options(dialog, "person-stage")).toEqual([
      "No stage",
      ...sundaySchool.stages.map((stage) => stage.name),
    ])
  })
})

test.each([
  ["en", "Add person"],
  ["de", "Person hinzufügen"],
  ["ar", "إضافة شخص"],
] as const)("whitespace-only names show both required messages in %s", async (locale, button) => {
  open({
    locale,
    create: () =>
      problem(422, "checkFields", {
        fieldErrors: {
          firstName: { code: "people.firstNameRequired", params: {} },
          lastName: { code: "people.lastNameRequired", params: {} },
        },
      }),
  })

  const dialog = await openDialog(button)
  await userEvent.type(dialog.getAllByRole("textbox")[0], "   ")
  await userEvent.click(dialog.getByRole("button", { name: button }))

  await waitFor(() =>
    expect(
      dialog
        .getAllByRole("textbox")
        .slice(0, 2)
        .every((field) => field.getAttribute("aria-invalid") === "true")
    ).toBe(true)
  )
})

describe("duplicates", () => {
  const duplicate = (candidates: unknown[]) => () =>
    problem(409, "people.duplicate", { params: { count: 1, name: "Mina Hanna" }, candidates })

  test("one candidate shows the warning and their groups; Add puts them on the placement", async () => {
    const sent = open({ create: duplicate([mina]) })
    const dialog = await openDialog()
    await userEvent.type(dialog.getByLabelText("First name"), "Mina")
    await userEvent.type(dialog.getByLabelText("Last name"), "Hanna")
    await userEvent.click(dialog.getByRole("button", { name: "Add person" }))

    expect(
      await dialog.findByText(/Someone called Mina Hanna already exists\./)
    ).toBeInTheDocument()

    expect(dialog.getByText("Youth Meeting", { selector: "li span" })).toBeInTheDocument()
    await userEvent.click(dialog.getByRole("button", { name: "Add" }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Added Mina Hanna."))

    expect(sent.at(-1)).toEqual({
      path: `/people/${mina.id}/memberships`,
      body: { serviceId: sundaySchool.id, stageId: null },
    })
  })

  test("409 alreadyIn keeps the dialog open with its message", async () => {
    open({
      create: duplicate([mina]),
      join: () =>
        problem(409, "people.alreadyIn", {
          params: { name: "Mina Hanna", where: "Sunday School" },
        }),
    })

    const dialog = await openDialog()
    await userEvent.type(dialog.getByLabelText("First name"), "Mina")
    await userEvent.click(dialog.getByRole("button", { name: "Add person" }))
    await userEvent.click(await dialog.findByRole("button", { name: "Add" }))
    expect(await dialog.findByText("Mina Hanna is already in Sunday School.")).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  test("while Add saves, adding a different person waits", async () => {
    open({ create: duplicate([mina]), join: () => new Promise<Response>(() => {}) })
    const dialog = await openDialog()
    await userEvent.type(dialog.getByLabelText("First name"), "Mina")
    await userEvent.click(dialog.getByRole("button", { name: "Add person" }))
    await userEvent.click(await dialog.findByRole("button", { name: "Add" }))

    expect(
      dialog.getByRole("button", { name: "It’s a different person, add anyway" })
    ).toBeDisabled()
  })

  test("Add anyway resends with confirmDuplicate; without candidates only it shows", async () => {
    let answer = duplicate([])
    const sent = open({ create: () => answer() })
    const dialog = await openDialog()
    await userEvent.type(dialog.getByLabelText("First name"), "Mina")
    await userEvent.type(dialog.getByLabelText("Last name"), "Hanna")
    await userEvent.click(dialog.getByRole("button", { name: "Add person" }))

    const anyway = await dialog.findByRole("button", {
      name: "It’s a different person, add anyway",
    })

    expect(dialog.queryByRole("button", { name: "Add" })).toBeNull()

    answer = () =>
      HttpResponse.json(
        {
          person: { id: "p2", firstName: "Mina", lastName: "Hanna", displayName: null },
          membership: null,
        },
        { status: 201 }
      )

    await userEvent.click(anyway)
    await waitFor(() => expect(sent).toHaveLength(2))

    expect(sent[1].body).toMatchObject({
      firstName: "Mina",
      lastName: "Hanna",
      confirmDuplicate: true,
    })
  })
})

test("a double click on Add person sends one request", async () => {
  let release = () => {}

  const sent = open({
    create: () => problem(500, "internal"),
  })

  server.use(
    http.post(apiUrl("/people"), async ({ request }) => {
      sent.push({ path: "/people", body: (await request.json()) as Record<string, unknown> })
      await new Promise<void>((resolve) => (release = resolve))

      return HttpResponse.json(
        {
          person: { id: "p1", firstName: "A", lastName: "B", displayName: null },
          membership: null,
        },
        { status: 201 }
      )
    })
  )

  const dialog = await openDialog()
  await userEvent.type(dialog.getByLabelText("First name"), "A")
  await userEvent.type(dialog.getByLabelText("Last name"), "B")
  await userEvent.dblClick(dialog.getByRole("button", { name: "Add person" }))
  await waitFor(() => expect(sent).toHaveLength(1))
  release()
  await waitFor(() => expect(toast.success).toHaveBeenCalled())
  expect(sent).toHaveLength(1)
})
