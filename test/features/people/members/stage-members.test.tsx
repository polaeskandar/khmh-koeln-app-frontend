import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, test } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import type { Stage } from "@/features/organization/stages/api"
import type { PersonRow } from "@/features/people/members/api"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { peopleList, person } from "@test/support/fixtures/people"
import { services } from "@test/support/fixtures/services"
import { SUNDAY_SCHOOL_ID, THIRD_CLASS_ID, thirdClass } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import { address } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import { StagePage } from "@/features/organization/stages/stage-page"

beforeEach(() => {
  address.set(`id=${THIRD_CLASS_ID}`)
})

const fourteen = [
  person("Kirollos", "Iskander", { displayName: "Kiro", startsOn: "2026-11-08" }),
  person("Mina", "Hanna"),
  ...Array.from({ length: 12 }, (_, i) => person(`Child${i + 1}`, "Girgis")),
]

function open(
  people: (url: URL) => Response,
  {
    locale = "en",
    viewer = me.administrator,
    stage = thirdClass,
  }: { locale?: Locale; viewer?: Me; stage?: Stage } = {}
) {
  const pages: string[] = []

  server.use(
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}`), () => HttpResponse.json(stage)),
    http.get(apiUrl("/people"), ({ request }) => {
      const url = new URL(request.url)
      pages.push(`${url.searchParams.get("stageId")}:${url.searchParams.get("page")}`)

      return people(url)
    })
  )

  renderWithProviders(<StagePage />, { locale, me: viewer, sidebar: true })

  return pages
}

const members = async () =>
  within((await screen.findByRole("heading", { name: /^Members/ })).closest("section")!)

test("lists the roster in API order with the preferred name and since when", async () => {
  const pages = open(() => HttpResponse.json(peopleList(fourteen)))
  const section = await members()
  expect(await section.findAllByRole("listitem")).toHaveLength(14)
  expect(section.getByRole("heading", { name: "Members (14)" })).toBeInTheDocument()
  const [kiro, mina] = section.getAllByRole("listitem")
  expect(kiro).toHaveTextContent("Kiro Iskander")
  expect(kiro).toHaveTextContent("Kirollos Iskander · since Sun 8 Nov 2026")
  expect(mina).toHaveTextContent(/^MHMina Hannasince Sun 6 Sep 2026$/)
  expect(pages).toEqual([`${THIRD_CLASS_ID}:1`])
})

test("says since in German", async () => {
  open(() => HttpResponse.json(peopleList(fourteen)), { locale: "de" })

  const section = within(
    (await screen.findByRole("heading", { name: /^Mitglieder/ })).closest("section")!
  )

  expect((await section.findAllByRole("listitem"))[0]).toHaveTextContent(
    "Kirollos Iskander · seit So., 8. Nov. 2026"
  )
})

test("pages through more than 25 members", async () => {
  const pageOne = Array.from({ length: 25 }, (_, i) => person(`First${i}`, "Saad"))
  const pageTwo = Array.from({ length: 5 }, (_, i) => person(`Second${i}`, "Saad"))

  const pages = open((url) =>
    HttpResponse.json(
      url.searchParams.get("page") === "2"
        ? peopleList(pageTwo, { page: 2, total: 30 })
        : peopleList(pageOne, { total: 30 })
    )
  )

  const section = await members()
  expect(await section.findByText("Showing 1–25 of 30")).toBeInTheDocument()
  expect(section.getByRole("button", { name: "Previous page" })).toBeDisabled()
  await userEvent.click(section.getByRole("button", { name: "Next page" }))
  expect(await section.findByText("Showing 26–30 of 30")).toBeInTheDocument()
  expect(section.getAllByRole("listitem")).toHaveLength(5)
  expect(pages).toEqual([`${THIRD_CLASS_ID}:1`, `${THIRD_CLASS_ID}:2`])
})

test("another stage starts on its first page", async () => {
  const otherId = "0192f3a4-7b1c-7d2e-8f3b-0000000009ff"
  const pageOne = Array.from({ length: 25 }, (_, i) => person(`First${i}`, "Saad"))
  const pages: string[] = []

  server.use(
    http.get(apiUrl(`/stages/${THIRD_CLASS_ID}`), () => HttpResponse.json(thirdClass)),
    http.get(apiUrl(`/stages/${otherId}`), () =>
      HttpResponse.json({ ...thirdClass, id: otherId, name: "4th Class" })
    ),
    http.get(apiUrl("/people"), ({ request }) => {
      const url = new URL(request.url)
      pages.push(`${url.searchParams.get("stageId")}:${url.searchParams.get("page")}`)

      return HttpResponse.json(
        url.searchParams.get("page") === "2"
          ? peopleList(pageOne.slice(0, 5), { page: 2, total: 30 })
          : peopleList(pageOne, { total: 30 })
      )
    })
  )

  const view = renderWithProviders(<StagePage />, { sidebar: true })
  await screen.findByText("Showing 1–25 of 30")
  address.set(`id=${otherId}`)
  view.rerender(<StagePage />)
  expect(await screen.findByRole("heading", { name: "4th Class" })).toBeInTheDocument()
  await userEvent.click(await (await members()).findByRole("button", { name: "Next page" }))
  await screen.findByText("Showing 26–30 of 30")
  address.set(`id=${THIRD_CLASS_ID}`)
  view.rerender(<StagePage />)
  expect(await screen.findByRole("heading", { name: thirdClass.name })).toBeInTheDocument()
  expect(await screen.findByText("Showing 1–25 of 30")).toBeInTheDocument()
  expect(pages).not.toContain(`${THIRD_CLASS_ID}:2`)
})

test("a 403 keeps the header and tabs but shows no names", async () => {
  open(() => problem(403, "forbidden"))
  expect(await screen.findByText("Not allowed")).toBeInTheDocument()
  expect(screen.getByRole("heading", { level: 1, name: "3rd Class" })).toBeInTheDocument()
  expect((await members()).queryByRole("listitem")).toBeNull()
})

test("an empty roster says so", async () => {
  open(() => HttpResponse.json(peopleList([])))
  expect(await screen.findByText("No members yet")).toBeInTheDocument()

  expect(
    screen.getByText("Add the children or people of this stage to build its roster.")
  ).toBeInTheDocument()
})

describe("Add person on an empty roster", () => {
  const sundaySchool = {
    ...services.items[0],
    id: SUNDAY_SCHOOL_ID,
    stages: [
      ...services.items[0].stages,
      { ...services.items[0].stages[0], id: THIRD_CLASS_ID, name: "Third Class" },
    ],
  }

  test("opens the dialog on this stage and refreshes the roster after adding", async () => {
    const mina = person("Mina", "Hanna")
    let roster: PersonRow[] = []
    const sent: unknown[] = []
    const pages = open(() => HttpResponse.json(peopleList(roster)))

    server.use(
      http.get(apiUrl("/services"), () => HttpResponse.json({ items: [sundaySchool] })),
      http.post(apiUrl("/people"), async ({ request }) => {
        sent.push(await request.json())
        roster = [mina]

        return HttpResponse.json({ person: mina.person, membership: null }, { status: 201 })
      })
    )

    await userEvent.click(await (await members()).findByRole("button", { name: "Add person" }))
    const dialog = within(await screen.findByRole("dialog"))
    expect(await dialog.findByLabelText("Service")).toHaveValue(SUNDAY_SCHOOL_ID)
    expect(dialog.getByLabelText("Stage")).toHaveValue(THIRD_CLASS_ID)
    await userEvent.type(dialog.getByLabelText("First name"), "Mina")
    await userEvent.type(dialog.getByLabelText("Last name"), "Hanna")
    await userEvent.click(dialog.getByRole("button", { name: "Add person" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(await (await members()).findByText("Mina Hanna")).toBeInTheDocument()

    expect(sent).toEqual([
      {
        firstName: "Mina",
        lastName: "Hanna",
        displayName: null,
        placement: { serviceId: SUNDAY_SCHOOL_ID, stageId: THIRD_CLASS_ID },
      },
    ])

    expect(pages).toEqual([`${THIRD_CLASS_ID}:1`, `${THIRD_CLASS_ID}:1`])
  })

  test.each([
    ["a servant", { viewer: me.servant }],
    ["an archived stage", { stage: { ...thirdClass, archived: true } }],
    [
      "an archived service",
      { stage: { ...thirdClass, service: { ...thirdClass.service, archived: true } } },
    ],
  ])("%s gets no Add person", async (_, options) => {
    open(() => HttpResponse.json(peopleList([])), options)
    expect(await screen.findByText("No members yet")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add person" })).toBeNull()
  })
})

test("Retry after a 500 asks again", async () => {
  let failing = true
  open(() => (failing ? problem(500, "internal") : HttpResponse.json(peopleList(fourteen))))
  const retry = await screen.findByRole("button", { name: "Try again" })
  failing = false
  await userEvent.click(retry)
  expect(await (await members()).findAllByRole("listitem")).toHaveLength(14)
})
