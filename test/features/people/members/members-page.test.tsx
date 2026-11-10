import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, test } from "vitest"

import { SessionProvider } from "@/features/identity/auth/session"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { peopleList, person } from "@test/support/fixtures/people"
import { services } from "@test/support/fixtures/services"
import { server } from "@test/support/msw"
import { address, navigation, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { PeopleList } from "@/features/people/members/api"
import { MembersPage } from "@/features/people/members/members-page"

beforeEach(() => {
  navigation.pathname = "/members/"
})

const sundaySchool = services.items[0]
const thirdClassStage = sundaySchool.stages.find((stage) => stage.name === "3rd Class")!

function open(answer: (url: URL) => PeopleList | Response, locale: Locale = "en") {
  const requests: URLSearchParams[] = []

  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(me.administrator)),
    http.get(apiUrl("/services"), () => HttpResponse.json(services)),
    http.get(apiUrl("/people"), ({ request }) => {
      const url = new URL(request.url)
      requests.push(url.searchParams)
      const result = answer(url)

      return result instanceof Response ? result : HttpResponse.json(result)
    })
  )

  renderWithProviders(
    <SessionProvider>
      <MembersPage />
    </SessionProvider>,
    { locale, sidebar: true }
  )

  return requests
}

const demi = person("Demiana", "Fanous", { displayName: "Demi" })
const nobodyPlaced = { ...person("Sara", "Wissa"), placements: [] }

test("typing sends one request with q and page 1; Clear resets it", async () => {
  const requests = open(() => peopleList([demi]))
  await screen.findAllByText("Demi Fanous")
  await userEvent.type(screen.getByRole("textbox", { name: "Search people" }), "mina han")
  await waitFor(() => expect(requests.at(-1)?.get("q")).toBe("mina han"))
  const searched = requests.filter((params) => params.get("q") === "mina han")
  expect(searched.map((params) => params.get("status")).sort()).toEqual(["active", "inactive"])
  expect(requests.at(-1)?.get("page")).toBe("1")
  await userEvent.click(screen.getByRole("button", { name: "Clear search" }))
  expect(screen.getByRole("textbox", { name: "Search people" })).toHaveValue("")
  expect(requests.every((params) => params.get("page") === "1")).toBe(true)
})

test("a stage filter sends stageId with q; page 2 shows the range", async () => {
  const requests = open((url) =>
    peopleList(
      Array.from({ length: 25 }, (_, i) => person(`P${i}`, "Saad")),
      { page: Number(url.searchParams.get("page") ?? 1), total: 121 }
    )
  )

  await screen.findByText("Showing 1–25 of 121 people")

  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Service" }),
    "Sunday School · 3rd Class"
  )

  await userEvent.type(screen.getByRole("textbox", { name: "Search people" }), "saad")
  await waitFor(() => expect(requests.at(-1)?.get("q")).toBe("saad"))
  expect(requests.at(-1)?.get("stageId")).toBe(thirdClassStage.id)
  await userEvent.click(screen.getByRole("button", { name: "Next page" }))
  expect(await screen.findByText("Showing 26–50 of 121 people")).toBeInTheDocument()
  expect(requests.at(-1)?.get("page")).toBe("2")
})

test("a search started and cleared on page 2 comes back on page 1", async () => {
  const requests = open((url) =>
    peopleList(
      Array.from({ length: 25 }, (_, i) => person(`P${i}`, "Saad")),
      { page: Number(url.searchParams.get("page") ?? 1), total: 121 }
    )
  )

  await screen.findByText("Showing 1–25 of 121 people")
  await userEvent.click(screen.getByRole("button", { name: "Next page" }))
  expect(await screen.findByText("Showing 26–50 of 121 people")).toBeInTheDocument()
  await userEvent.type(screen.getByRole("textbox", { name: "Search people" }), "saad")
  await waitFor(() => expect(requests.at(-1)?.get("q")).toBe("saad"))
  await userEvent.clear(screen.getByRole("textbox", { name: "Search people" }))
  expect(await screen.findByText("Showing 1–25 of 121 people")).toBeInTheDocument()
})

test("a display name shows the full name under it; no placements read No service", async () => {
  open(() => peopleList([demi, nobodyPlaced]))
  const table = within(await screen.findByRole("table"))
  expect(table.getByText("Demiana Fanous")).toBeInTheDocument()
  expect(table.getAllByRole("row")[2]).toHaveTextContent("No service")
  expect(table.getAllByRole("row")[1]).toHaveTextContent("3rd Class (Sunday School)")
})

test("403 shows no access; empty results show the right state", async () => {
  open(() => problem(403, "forbidden"))
  expect(await screen.findByText("Not allowed")).toBeInTheDocument()
})

test("empty results say Nobody here, or Nobody matches the query", async () => {
  open(() => peopleList([]))
  expect(await screen.findAllByText("Nobody here")).not.toHaveLength(0)
  await userEvent.type(screen.getByRole("textbox", { name: "Search people" }), "zz")
  expect(await screen.findAllByText("Nobody matches “zz”")).not.toHaveLength(0)

  expect(
    screen.getAllByText("Check the spelling, or look in the other tabs.").length
  ).toBeGreaterThan(0)

  expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull()
})

describe("an empty list names the filters", () => {
  const thirdClassGroup = `stage%3A${thirdClassStage.id}`
  const named = "⁨Sunday School · 3rd Class⁩"

  test("a search in a group says the group hides people; each button clears its part", async () => {
    address.set(`q=kiro&group=stage:${thirdClassStage.id}`)
    open(() => peopleList([]))
    expect(await screen.findAllByText("Nobody matches “kiro”")).not.toHaveLength(0)

    expect(
      screen.getAllByText(`Check the spelling, or clear the filters (${named}) to search everyone.`)
        .length
    ).toBeGreaterThan(0)

    await userEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0])
    expect(router.push).toHaveBeenLastCalledWith("/members/?q=kiro", { scroll: false })
    act(() => address.set(`q=kiro&group=stage:${thirdClassStage.id}`))
    await userEvent.click((await screen.findAllByRole("button", { name: "Clear search" }))[1])

    expect(router.replace).toHaveBeenLastCalledWith(`/members/?group=${thirdClassGroup}`, {
      scroll: false,
    })
  })

  test("the Inactive tab with a group and no search names both; Clear filters goes back to Active", async () => {
    address.set(`group=stage:${thirdClassStage.id}&status=inactive`)
    open(() => peopleList([]))

    expect(
      await screen.findAllByText(
        `Filters are on: ${named}, ⁨Inactive⁩. Clear them to see everyone.`
      )
    ).not.toHaveLength(0)

    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull()
    await userEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0])
    expect(router.push).toHaveBeenLastCalledWith("/members/", { scroll: false })

    expect(await screen.findByRole("tab", { name: /^Active/ })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  test.each([
    [
      "de",
      "Filter gesetzt: ⁨Inaktiv⁩. Setzen Sie die Filter zurück, um alle zu sehen.",
      "Filter zurücksetzen",
    ],
    ["ar", "عوامل التصفية مفعّلة: ⁨غير نشط⁩. امسحها لرؤية الجميع.", "مسح عوامل التصفية"],
  ] as const)("reads in %s", async (locale, hint, button) => {
    address.set("status=inactive")
    open(() => peopleList([]), locale)
    expect(await screen.findAllByText(hint)).not.toHaveLength(0)
    expect(screen.getAllByRole("button", { name: button }).length).toBeGreaterThan(0)
  })
})

test("in Arabic the phone rows join groups with the Arabic comma", async () => {
  const twoGroups = {
    ...demi,
    placements: [...demi.placements, { ...demi.placements[0], membershipId: "m2", stage: null }],
  }

  open(() => peopleList([twoGroups]), "ar")
  const list = within(await screen.findByRole("list", { name: "المخدومون" }))
  expect(list.getByRole("listitem")).toHaveTextContent("3rd Class (Sunday School)، Sunday School")
})

describe("the address keeps the list", () => {
  const thirdClassGroup = `stage:${thirdClassStage.id}`

  test("a link with q, group and tab shows them and sends them", async () => {
    address.set(`q=saad&group=${thirdClassGroup}&status=all`)
    const requests = open(() => peopleList([demi]))
    expect(await screen.findByRole("textbox", { name: "Search people" })).toHaveValue("saad")

    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Service" })).toHaveValue(thirdClassGroup)
    )

    expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute("aria-selected", "true")
    await waitFor(() => expect(requests).toHaveLength(3))

    expect(requests.map((params) => params.get("status")).sort()).toEqual([
      "active",
      "all",
      "inactive",
    ])

    expect(requests.every((params) => params.get("q") === "saad")).toBe(true)
    expect(requests.every((params) => params.get("stageId") === thirdClassStage.id)).toBe(true)
  })

  test("typing replaces the address; a filter or a tab adds a history entry", async () => {
    open(() => peopleList([demi]))
    await screen.findAllByText("Demi Fanous")
    await userEvent.type(screen.getByRole("textbox", { name: "Search people" }), "mina")

    await waitFor(() =>
      expect(router.replace).toHaveBeenLastCalledWith("/members/?q=mina", { scroll: false })
    )

    expect(router.replace).toHaveBeenCalledTimes(1)

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Service" }),
      "Sunday School · 3rd Class"
    )

    expect(router.push).toHaveBeenLastCalledWith(
      `/members/?q=mina&group=stage%3A${thirdClassStage.id}`,
      { scroll: false }
    )

    await userEvent.click(screen.getByRole("tab", { name: /^Inactive/ }))

    expect(router.push).toHaveBeenLastCalledWith(
      `/members/?q=mina&group=stage%3A${thirdClassStage.id}&status=inactive`,
      { scroll: false }
    )

    await userEvent.click(screen.getByRole("button", { name: "Clear search" }))

    expect(router.replace).toHaveBeenLastCalledWith(
      `/members/?group=stage%3A${thirdClassStage.id}&status=inactive`,
      { scroll: false }
    )

    expect(router.replace).toHaveBeenCalledTimes(2)
    expect(router.push).toHaveBeenCalledTimes(2)
  })

  test("going back and forward puts the search back into the field", async () => {
    const requests = open(() => peopleList([demi]))
    const field = await screen.findByRole("textbox", { name: "Search people" })
    act(() => address.set("q=mina"))
    await waitFor(() => expect(field).toHaveValue("mina"))
    await waitFor(() => expect(requests.at(-1)?.get("q")).toBe("mina"))
    act(() => address.set(""))
    await waitFor(() => expect(field).toHaveValue(""))
    expect(router.replace).not.toHaveBeenCalled()
  })

  test("an unknown group or status falls back to all services on Active", async () => {
    address.set("group=stage:0192f3a4-7b1c-7d2e-8f3b-0000000009ff&status=archived")
    const requests = open(() => peopleList([demi]))
    await screen.findAllByText("Demi Fanous")
    expect(screen.getByRole("combobox", { name: "Service" })).toHaveValue("")
    expect(screen.getByRole("tab", { name: /^Active/ })).toHaveAttribute("aria-selected", "true")
    expect(requests.every((params) => params.get("stageId") === null)).toBe(true)
    expect(requests.map((params) => params.get("status")).sort()).toEqual(["active", "inactive"])
  })
})
