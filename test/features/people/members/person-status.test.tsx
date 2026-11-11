import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, expect, test } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import { SessionProvider } from "@/features/identity/auth/session"
import type { Locale } from "@/i18n/config"
import type { Schemas } from "@/lib/api/client"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { peopleList, person } from "@test/support/fixtures/people"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { navigation } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import { expectToast } from "@test/support/toasts"
import type { PersonRow } from "@/features/people/members/api"
import { MembersPage } from "@/features/people/members/members-page"

beforeEach(() => {
  navigation.pathname = "/members/"
})

function open(
  initial: PersonRow,
  {
    deactivate = () => HttpResponse.json({ ...initial.person, status: "inactive" }),
    viewer = me.administrator,
    locale = "en",
  }: { deactivate?: () => Response; viewer?: Me; locale?: Locale } = {}
) {
  let lydia = initial
  const requests: URLSearchParams[] = []
  const posts: string[] = []
  const reads = { services: 0 }

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(viewer)),
    http.get(apiUrl("/services"), () => {
      reads.services++

      return HttpResponse.json(services)
    }),
    http.get(apiUrl("/people"), ({ request }) => {
      const params = new URL(request.url).searchParams
      requests.push(params)
      const status = params.get("status")
      const matches = status === "all" || lydia.person.status === status ? [lydia] : []
      const total = (status === "active" ? 120 : status === "inactive" ? 1 : 121) + matches.length

      return HttpResponse.json(peopleList(matches, { total }))
    }),
    http.post(apiUrl(`/people/${initial.person.id}/deactivate`), () => {
      posts.push("deactivate")
      const response = deactivate()

      if (response.ok) {
        lydia = {
          ...lydia,
          person: { ...lydia.person, status: "inactive" },
          placements: [],
          pastPlacements: lydia.placements.map((p) => ({ ...p, endsOn: "2026-11-07" })),
        }
      }

      return response
    }),
    http.post(apiUrl(`/people/${initial.person.id}/reactivate`), () => {
      posts.push("reactivate")
      lydia = { ...lydia, person: { ...lydia.person, status: "active" }, placements: [] }

      return HttpResponse.json(lydia.person)
    }),
    http.post(apiUrl(`/people/${initial.person.id}/memberships`), async ({ request }) => {
      const body = (await request.json()) as Schemas["PlacementRequest"]
      posts.push("join")
      const service = services.items.find((item) => item.id === body.serviceId)!
      const stage = service.stages.find((item) => item.id === body.stageId)!

      lydia = {
        ...lydia,
        placements: [
          {
            membershipId: "m-new",
            service: { id: service.id, name: service.name, tone: service.tone, archived: false },
            stage: { ...stage, archived: false },
            startsOn: "2026-11-08",
            endsOn: null,
          },
        ],
      }

      return HttpResponse.json(
        { id: "m-new", personId: initial.person.id, startsOn: "2026-11-08", endsOn: null },
        { status: 201 }
      )
    })
  )

  renderWithProviders(
    <SessionProvider>
      <MembersPage />
    </SessionProvider>,
    { locale, sidebar: true }
  )

  return { requests, posts, reads }
}

const lydia = () => person("Lydia", "Aziz")

const inactive = (row: PersonRow): PersonRow => ({
  ...row,
  person: { ...row.person, status: "inactive" },
})

const openSheet = async () => {
  const table = within(await screen.findByRole("table"))
  await userEvent.click(table.getByRole("button", { name: /Lydia Aziz/ }))

  return within(await screen.findByRole("dialog"))
}

test("tabs show each status's total, and Inactive asks for page 1 of the inactive", async () => {
  const { requests } = open(lydia())
  expect(await screen.findByRole("tab", { name: "Active (121)" })).toBeInTheDocument()
  expect(await screen.findByRole("tab", { name: "Inactive (1)" })).toBeInTheDocument()
  expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument()
  await userEvent.click(screen.getByRole("tab", { name: /^Inactive/ }))
  await waitFor(() => expect(requests.at(-1)?.get("status")).toBe("inactive"))
  expect(requests.at(-1)?.get("page")).toBe("1")
})

test("marking as inactive on Active keeps the sheet on the person while the row leaves", async () => {
  const { posts } = open(lydia())
  const sheet = await openSheet()
  await userEvent.click(sheet.getByRole("button", { name: "Mark as inactive" }))
  const dialog = within(await screen.findByRole("alertdialog"))
  expect(dialog.getByText(/They no longer appear on rosters/)).toBeInTheDocument()

  expect(
    dialog.getByText(/Their attendance and memberships stay in the history/)
  ).toBeInTheDocument()

  expect(dialog.getByText(/You can reactivate them at any time/)).toBeInTheDocument()
  await userEvent.click(dialog.getByRole("button", { name: "Mark as inactive" }))

  await expectToast("Marked Lydia Aziz as inactive.")

  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
  expect(await sheet.findByRole("button", { name: "Reactivate" })).toBeInTheDocument()
  expect(sheet.getByRole("heading", { name: "Lydia Aziz" })).toBeInTheDocument()
  expect(sheet.getByText("Inactive")).toBeInTheDocument()
  expect(await sheet.findByText("No service at the moment.")).toBeInTheDocument()

  expect(
    await sheet.findByText(/3rd Class \(Sunday School\), Sun 6 Sep 2026 to/)
  ).toBeInTheDocument()

  expect(await screen.findByRole("tab", { name: "Active (120)", hidden: true })).toBeInTheDocument()
  expect(screen.getByRole("tab", { name: "Inactive (2)", hidden: true })).toBeInTheDocument()
  expect(screen.queryByRole("button", { name: /Lydia Aziz/, hidden: true })).toBeNull()
  expect(posts).toEqual(["deactivate"])
})

test("marking as inactive refetches the services, whose member counts change", async () => {
  const { reads } = open(lydia())
  const sheet = await openSheet()
  await waitFor(() => expect(reads.services).toBe(1))
  await userEvent.click(sheet.getByRole("button", { name: "Mark as inactive" }))
  const dialog = within(await screen.findByRole("alertdialog"))
  await userEvent.click(dialog.getByRole("button", { name: "Mark as inactive" }))
  await waitFor(() => expect(reads.services).toBe(2))
})

test("on All the sheet stays open with the badge and Reactivate, and no Add to", async () => {
  open(lydia())
  await userEvent.click(await screen.findByRole("tab", { name: "All" }))
  const sheet = await openSheet()
  await userEvent.click(sheet.getByRole("button", { name: "Mark as inactive" }))

  await userEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Mark as inactive" })
  )

  expect(await sheet.findByRole("button", { name: "Reactivate" })).toBeInTheDocument()
  expect(sheet.getByText("Inactive")).toBeInTheDocument()
  expect(sheet.queryByRole("combobox", { name: "Add to" })).not.toBeInTheDocument()
  expect(sheet.queryByRole("button", { name: /^Remove from/ })).not.toBeInTheDocument()
})

test("reactivating keeps the sheet open, so a group can be added straight away", async () => {
  const { posts } = open({ ...inactive(lydia()), placements: [] })
  await userEvent.click(await screen.findByRole("tab", { name: /^Inactive/ }))
  const sheet = await openSheet()
  await userEvent.click(sheet.getByRole("button", { name: "Reactivate" }))
  await expectToast("Reactivated Lydia Aziz.")
  const addTo = await sheet.findByRole("combobox", { name: "Add to" })
  expect(sheet.queryByText("Inactive")).toBeNull()
  expect(sheet.getByText("No service at the moment.")).toBeInTheDocument()
  await userEvent.selectOptions(addTo, "Sunday School · 1st Class")
  await userEvent.click(sheet.getByRole("button", { name: "Add" }))
  await expectToast("Added.")
  expect(await sheet.findByText("1st Class (Sunday School)")).toBeInTheDocument()
  expect(posts).toEqual(["reactivate", "join"])
  await userEvent.keyboard("{Escape}")
  await userEvent.click(screen.getByRole("tab", { name: /^Active/ }))

  const row = (
    await within(await screen.findByRole("table")).findByRole("button", { name: /Lydia Aziz/ })
  ).closest("tr")!

  expect(row).toHaveTextContent("1st Class (Sunday School)")
})

test.each([
  ["de", "Als inaktiv markieren", "Lydia Aziz als inaktiv markiert."],
  ["ar", "تعيين كغير نشط", "تم تعيين «Lydia Aziz» كغير نشط."],
] as const)("the toast names the person in %s", async (locale, button, text) => {
  open(lydia(), { locale })
  const sheet = await openSheet()
  await userEvent.click(sheet.getByRole("button", { name: button }))

  await userEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", { name: button })
  )

  await expectToast(text)
})

test("Reactivate is disabled with the spinner while it runs", async () => {
  const row = inactive(lydia())
  open(row)
  let release = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))

  server.use(
    http.post(apiUrl(`/people/${row.person.id}/reactivate`), async () => {
      await gate

      return HttpResponse.json({ ...row.person, status: "active" })
    })
  )

  await userEvent.click(await screen.findByRole("tab", { name: /^Inactive/ }))
  const sheet = await openSheet()
  const reactivate = sheet.getByRole("button", { name: "Reactivate" })
  await userEvent.click(reactivate)
  await waitFor(() => expect(reactivate).toBeDisabled())
  expect(within(reactivate).getByRole("status", { name: "Loading" })).toBeInTheDocument()
  release()
  await expectToast("Reactivated Lydia Aziz.")
})

test("without members: update there is no footer", async () => {
  open(lydia(), { viewer: me.servant })
  const sheet = await openSheet()
  expect(sheet.queryByRole("button", { name: "Mark as inactive" })).not.toBeInTheDocument()
})

test("a 403 on deactivate toasts and changes nothing", async () => {
  open(lydia(), {
    deactivate: () => problem(403, "people.changeNotAllowed"),
  })

  const sheet = await openSheet()
  await userEvent.click(sheet.getByRole("button", { name: "Mark as inactive" }))

  await userEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Mark as inactive" })
  )

  await expectToast("You can’t change people or their stages.")
  expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  expect(sheet.getByRole("button", { name: "Mark as inactive", hidden: true })).toBeInTheDocument()
})
