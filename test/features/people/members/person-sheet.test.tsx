import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import type { Locale } from "@/i18n/config"
import type { Schemas } from "@/lib/api/client"
import { apiUrl } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { peopleList, person } from "@test/support/fixtures/people"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { PersonRow } from "@/features/people/members/api"
import { MembersScreen } from "@/features/people/members/members-page"

beforeEach(() => {
  vi.spyOn(toast, "success")
})

function open(initial: PersonRow, locale: Locale = "en", viewer: Me = me.administrator) {
  let current = initial
  const sent: { path: string; body: unknown }[] = []

  server.use(
    http.get(apiUrl("/services"), () => HttpResponse.json(services)),
    http.get(apiUrl("/people"), ({ request }) => {
      const params = new URL(request.url).searchParams
      const name = `${current.person.firstName} ${current.person.lastName}`.toLowerCase()
      const words = (params.get("q") ?? "").toLowerCase().split(" ").filter(Boolean)
      const inGroup = !params.get("stageId") || current.placements.length > 0
      const shown = inGroup && words.every((word) => name.includes(word))

      return HttpResponse.json(peopleList(shown ? [current] : []))
    }),
    http.put(apiUrl(`/people/${initial.person.id}`), async ({ request }) => {
      const body = (await request.json()) as Schemas["RenamePersonRequest"]
      sent.push({ path: "put", body })

      current = {
        ...current,
        person: {
          ...current.person,
          firstName: body.firstName ?? "",
          lastName: body.lastName ?? "",
          displayName: body.displayName ?? null,
        },
      }

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
      const body = (await request.json()) as Schemas["PlacementRequest"]
      sent.push({ path: "join", body })
      const service = services.items.find((item) => item.id === body.serviceId)!
      const stage = service.stages.find((item) => item.id === body.stageId)

      const added: Schemas["AddedMembershipResponse"] = {
        id: "m-new",
        personId: initial.person.id,
        service: { id: service.id, name: service.name, tone: service.tone, archived: false },
        stage: stage ? { ...stage, archived: false } : null,
        startsOn: "2026-11-08",
        endsOn: null,
      }

      return HttpResponse.json(added, { status: 201 })
    })
  )

  renderWithProviders(<MembersScreen />, { locale, me: viewer, sidebar: true })

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

  expect(sent).toEqual([
    { path: "put", body: { firstName: "Mina", lastName: "Hanna", displayName: null } },
  ])

  expect(
    await within(screen.getByRole("table", { hidden: true })).findByText("Mina Hanna")
  ).toBeInTheDocument()
})

test("typing the old name again hides Save name and sends nothing", async () => {
  const sent = open(person("Mina", "Hanna", { displayName: "Mimi" }))
  const sheet = await openSheet("Mimi")
  await userEvent.clear(sheet.getByLabelText("Last name"))
  await userEvent.type(sheet.getByLabelText("Last name"), "Hanna")
  expect(sheet.queryByRole("button", { name: "Save name" })).toBeNull()
  await userEvent.type(sheet.getByLabelText("Last name"), "{Enter}")
  expect(sent).toEqual([])
})

test("a cleared display name is sent as null with the other names", async () => {
  const sent = open(person("Mina", "Hanna", { displayName: "Mimi" }))
  const sheet = await openSheet("Mimi")
  await userEvent.clear(sheet.getByLabelText(/Display name/))
  await userEvent.click(sheet.getByRole("button", { name: "Save name" }))

  await waitFor(() =>
    expect(sent).toEqual([
      { path: "put", body: { firstName: "Mina", lastName: "Hanna", displayName: null } },
    ])
  )
})

test("without members: update there is no name form or Add to", async () => {
  open(person("Mina", "Hanna"), "en", me.servant)
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

test("Add to offers the active groups the person lacks, but not their stage's service", async () => {
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
  expect(offered).not.toContain("Choir")
  expect(offered).not.toContain("Sunday School")
  expect(offered).toContain("Sunday School · 1st Class")
  await userEvent.selectOptions(select, "Sunday School · 1st Class")
  await userEvent.click(sheet.getByRole("button", { name: "Add" }))
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Added."))
  const firstClass = services.items[0].stages.find((stage) => stage.name === "1st Class")!

  expect(sent).toEqual([
    { path: "join", body: { serviceId: services.items[0].id, stageId: firstClass.id } },
  ])
})

test("someone on a service itself isn't offered its stages", async () => {
  const sundaySchool = services.items[0]
  const mina = person("Mina", "Hanna")

  open({
    ...mina,
    placements: [
      {
        ...mina.placements[0],
        service: { id: sundaySchool.id, name: sundaySchool.name, tone: 1, archived: false },
        stage: null,
      },
    ],
  })

  const sheet = await openSheet("Mina Hanna")

  const offered = within(sheet.getByRole("combobox", { name: "Add to" }))
    .getAllByRole("option")
    .map((option) => option.textContent)

  expect(offered.filter((label) => label?.startsWith("Sunday School"))).toEqual([])
})

test("in Arabic the sheet opens from the left", async () => {
  open(person("Mina", "Hanna"), "ar")
  await openSheet("Mina Hanna")
  expect(document.querySelector("[data-slot='sheet-content']")).toHaveAttribute("data-side", "left")
})

test("renamed, then removed from the filtered stage, the sheet stays on the new name", async () => {
  open(person("Mina", "Hana"))
  await screen.findByRole("table")

  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Service" }),
    "Sunday School · 3rd Class"
  )

  const sheet = await openSheet("Mina Hana")
  await userEvent.clear(sheet.getByLabelText("Last name"))
  await userEvent.type(sheet.getByLabelText("Last name"), "Hanna")
  await userEvent.click(sheet.getByRole("button", { name: "Save name" }))
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Saved."))

  await userEvent.click(
    sheet.getByRole("button", { name: "Actions for 3rd Class (Sunday School)" })
  )

  await userEvent.click(
    await screen.findByRole("menuitem", { name: "Remove from 3rd Class (Sunday School)" })
  )

  await userEvent.click(
    within(screen.getByRole("alertdialog")).getByRole("button", { name: "Remove" })
  )

  await waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith("Removed. Past attendance is kept.")
  )

  expect(await sheet.findByText("No service at the moment.")).toBeInTheDocument()
  expect(sheet.getByRole("heading", { name: "Mina Hanna" })).toBeInTheDocument()
  expect(sheet.getByText(/3rd Class \(Sunday School\), Sun 6 Sep 2026 to/)).toBeInTheDocument()
})

describe("pending", () => {
  const held = () => {
    let release = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))

    return { gate, release: () => release() }
  }

  test("a second click on Add during the request sends it once", async () => {
    open(person("Mina", "Hanna"))
    const sheet = await openSheet("Mina Hanna")
    const request = held()
    let joins = 0

    server.use(
      http.post(apiUrl("/people/:id/memberships"), async () => {
        joins++
        await request.gate

        return HttpResponse.json({ id: "m-new" }, { status: 201 })
      })
    )

    const add = sheet.getByRole("button", { name: "Add" })
    await userEvent.click(add)
    await waitFor(() => expect(add).toBeDisabled())
    expect(within(add).getByRole("status", { name: "Loading" })).toBeInTheDocument()
    await userEvent.click(add)
    request.release()
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Added."))
    expect(joins).toBe(1)
  })

  test("Add stays pending until the list has been fetched again", async () => {
    const mina = person("Mina", "Hanna")
    const sent = open(mina)
    const sheet = await openSheet("Mina Hanna")
    const refetch = held()

    server.use(
      http.get(apiUrl("/people"), async () => {
        await refetch.gate

        return HttpResponse.json(peopleList([mina]))
      })
    )

    const add = sheet.getByRole("button", { name: "Add" })
    await userEvent.click(add)
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Added."))
    expect(add).toBeDisabled()
    expect(within(add).getByRole("status", { name: "Loading" })).toBeInTheDocument()
    await userEvent.click(add)
    refetch.release()
    await waitFor(() => expect(add).toBeEnabled())
    expect(sent.filter((request) => request.path === "join")).toHaveLength(1)
  })

  test("Save name is disabled with the spinner while it saves", async () => {
    const mina = person("Mina", "Hana")
    open(mina)
    const sheet = await openSheet("Mina Hana")
    const request = held()

    server.use(
      http.put(apiUrl(`/people/${mina.person.id}`), async () => {
        await request.gate

        return HttpResponse.json({ ...mina.person, lastName: "Hanan" })
      })
    )

    await userEvent.type(sheet.getByLabelText("Last name"), "n")
    const save = sheet.getByRole("button", { name: "Save name" })
    await userEvent.click(save)
    await waitFor(() => expect(save).toBeDisabled())
    expect(within(save).getByRole("status", { name: "Loading" })).toBeInTheDocument()
    request.release()
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Saved."))
  })
})
