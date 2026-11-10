import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import type { Locale } from "@/i18n/config"
import type { Schemas } from "@/lib/api/client"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { peopleList } from "@test/support/fixtures/people"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import { MembersScreen } from "@/features/people/members/members-page"

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
  vi.spyOn(toast, "error")
})

const sundaySchool = services.items[0]

const addOnly: Me = {
  ...me.churchOffice,
  permissions: [
    { action: "read", resource: "services", scope: "church" },
    { action: "read", resource: "members", scope: "church" },
    { action: "create", resource: "members", scope: "church" },
  ],
}

const mina: Schemas["DirectoryEntry"] = {
  id: "0192f3a4-7b1c-7d2e-8f60-000000000001",
  firstName: "Mina",
  lastName: "Hanna",
  displayName: null,
  groups: [{ service: { id: "y", name: "Youth Meeting", tone: 2, archived: false }, stage: null }],
}

const created = (
  id: string,
  firstName: string,
  lastName: string
): Schemas["CreatedPersonResponse"] => ({
  person: { id, firstName, lastName, displayName: null, status: "active" },
  membership: null,
})

const joined: Schemas["AddedMembershipResponse"] = {
  id: "m2",
  personId: mina.id,
  service: { id: sundaySchool.id, name: sundaySchool.name, tone: 1, archived: false },
  stage: null,
  startsOn: "2026-11-08",
  endsOn: null,
}

function open({
  create = () => HttpResponse.json(created("p1", "Mina", "Hanna"), { status: 201 }),
  join = (): Response | Promise<Response> => HttpResponse.json(joined, { status: 201 }),
  locale = "en" as Locale,
  viewer = me.administrator,
} = {}) {
  const sent: { path: string; body: Record<string, unknown> }[] = []

  server.use(
    http.get(apiUrl("/services"), () => HttpResponse.json(services)),
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

  renderWithProviders(<MembersScreen />, { locale, me: viewer, sidebar: true })

  return sent
}

const openDialog = async (name = "Add person") => {
  await userEvent.click(await screen.findByRole("button", { name }))

  return within(await screen.findByRole("dialog"))
}

const options = (dialog: { getByLabelText: (label: string) => HTMLElement }, label: string) =>
  within(dialog.getByLabelText(label))
    .getAllByRole("option")
    .map((option) => option.textContent)

describe("placements", () => {
  test("every active service is offered, the archived one is not", async () => {
    open()
    const dialog = await openDialog()

    expect(options(dialog, "Service")).toEqual(
      services.items.filter((service) => !service.archived).map((service) => service.name)
    )
  })

  test("No stage comes first and is chosen, then every stage", async () => {
    open()
    const dialog = await openDialog()

    expect(options(dialog, "Stage")).toEqual([
      "No stage",
      ...sundaySchool.stages.map((stage) => stage.name),
    ])

    expect(dialog.getByLabelText("Stage")).toHaveValue("")
  })

  test("without members: create there is no Add person", async () => {
    open({ viewer: me.servant })
    expect(await screen.findByRole("tab", { name: /^Active/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add person" })).toBeNull()
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

  test("409 alreadyInService says a person is on the service or its stages", async () => {
    open({
      create: duplicate([mina]),
      join: () =>
        problem(409, "people.alreadyInService", {
          params: { name: "Mina Hanna", where: "3rd Class" },
        }),
    })

    const dialog = await openDialog()
    await userEvent.type(dialog.getByLabelText("First name"), "Mina")
    await userEvent.click(dialog.getByRole("button", { name: "Add person" }))
    await userEvent.click(await dialog.findByRole("button", { name: "Add" }))

    expect(
      await dialog.findByText(
        "Mina Hanna is already in 3rd Class. Within one service, a person is on the service itself or on its stages, not both."
      )
    ).toBeInTheDocument()
  })

  describe("a candidate already in the chosen group", () => {
    const third = sundaySchool.stages.find((stage) => stage.name === "3rd Class")!

    const inThirdClass: Schemas["DirectoryEntry"] = {
      ...mina,
      groups: [
        {
          service: { id: sundaySchool.id, name: sundaySchool.name, tone: 1, archived: false },
          stage: { id: third.id, name: third.name, position: third.position, archived: false },
        },
      ],
    }

    const kiro: Schemas["DirectoryEntry"] = {
      ...mina,
      id: "0192f3a4-7b1c-7d2e-8f60-000000000002",
    }

    test.each([
      ["en", "Add person", "Already in ⁨3rd Class⁩"],
      ["de", "Person hinzufügen", "Bereits in ⁨3rd Class⁩"],
      ["ar", "إضافة شخص", "موجود بالفعل في «⁨3rd Class⁩»"],
    ] as const)(
      "%s reads Already in instead of Add and sends nothing",
      async (locale, button, text) => {
        const sent = open({ create: duplicate([inThirdClass, kiro]), locale })
        const dialog = await openDialog(button)
        await userEvent.selectOptions(dialog.getAllByRole("combobox")[1], third.id)
        await userEvent.type(dialog.getAllByRole("textbox")[0], "Mina")
        await userEvent.click(dialog.getByRole("button", { name: button }))
        const already = await dialog.findByText(text)
        const rows = dialog.getAllByRole("listitem")
        expect(rows[0]).toContainElement(already)
        expect(within(rows[0]).queryByRole("button")).toBeNull()
        expect(within(rows[1]).getByRole("button")).toBeInTheDocument()
        expect(sent.map((request) => request.path)).toEqual(["/people"])
      }
    )

    test("choosing another stage offers Add again", async () => {
      const sent = open({ create: duplicate([inThirdClass]) })
      const dialog = await openDialog()
      await userEvent.selectOptions(dialog.getByLabelText("Stage"), "3rd Class")
      await userEvent.type(dialog.getByLabelText("First name"), "Mina")
      await userEvent.click(dialog.getByRole("button", { name: "Add person" }))
      expect(await dialog.findByText("Already in ⁨3rd Class⁩")).toBeInTheDocument()
      expect(dialog.queryByRole("button", { name: "Add" })).toBeNull()
      await userEvent.selectOptions(dialog.getByLabelText("Stage"), "1st Class")
      expect(dialog.queryByText(/Already in/)).toBeNull()
      await userEvent.click(dialog.getByRole("button", { name: "Add" }))
      await waitFor(() => expect(sent).toHaveLength(2))
      const firstClass = sundaySchool.stages.find((stage) => stage.name === "1st Class")!

      expect(sent[1]).toEqual({
        path: `/people/${mina.id}/memberships`,
        body: { serviceId: sundaySchool.id, stageId: firstClass.id },
      })
    })

    test("the service itself reads Already in for someone on its stage", async () => {
      const sent = open({ create: duplicate([inThirdClass]) })
      const dialog = await openDialog()
      await userEvent.selectOptions(dialog.getByLabelText("Stage"), "")
      await userEvent.type(dialog.getByLabelText("First name"), "Mina")
      await userEvent.click(dialog.getByRole("button", { name: "Add person" }))
      expect(await dialog.findByText("Already in ⁨3rd Class⁩")).toBeInTheDocument()
      expect(dialog.queryByRole("button", { name: "Add" })).toBeNull()
      expect(sent.map((request) => request.path)).toEqual(["/people"])
    })
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

  test("without members: update a candidate can't be added, only Add anyway shows", async () => {
    open({ create: duplicate([mina]), viewer: addOnly })
    const dialog = await openDialog()
    await userEvent.type(dialog.getByLabelText("First name"), "Mina")
    await userEvent.click(dialog.getByRole("button", { name: "Add person" }))

    expect(
      await dialog.findByRole("button", { name: "It’s a different person, add anyway" })
    ).toBeInTheDocument()

    expect(dialog.getByText("Youth Meeting", { selector: "li span" })).toBeInTheDocument()
    expect(dialog.queryByRole("button", { name: "Add" })).toBeNull()
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

    answer = () => HttpResponse.json(created("p2", "Mina", "Hanna"), { status: 201 })

    await userEvent.click(anyway)
    await waitFor(() => expect(sent).toHaveLength(2))

    expect(sent[1].body).toMatchObject({
      firstName: "Mina",
      lastName: "Hanna",
      confirmDuplicate: true,
    })
  })
})

test("Escape doesn't close the dialog while the person is saved", async () => {
  let release = () => {}
  open()

  server.use(
    http.post(apiUrl("/people"), async () => {
      await new Promise<void>((resolve) => (release = resolve))

      return HttpResponse.json(created("p1", "A", "B"), { status: 201 })
    })
  )

  const dialog = await openDialog()
  await userEvent.type(dialog.getByLabelText("First name"), "A")
  await userEvent.type(dialog.getByLabelText("Last name"), "B")
  await userEvent.click(dialog.getByRole("button", { name: "Add person" }))
  await waitFor(() => expect(dialog.getByRole("button", { name: /Add person/ })).toBeDisabled())
  await userEvent.keyboard("{Escape}")
  expect(screen.getByRole("dialog")).toBeInTheDocument()
  release()
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
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

      return HttpResponse.json(created("p1", "A", "B"), { status: 201 })
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
