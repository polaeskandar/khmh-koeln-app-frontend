import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, test } from "vitest"

import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { peopleList } from "@test/support/fixtures/people"
import { SUNDAY_SCHOOL_ID, THIRD_CLASS_ID, thirdClass } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import type { Locale } from "@/i18n/config"
import { address } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import { StageOverview, useStageCrumbs } from "@/features/organization/stages/stage-layout"

const ID = THIRD_CLASS_ID
const SERVICE_ID = SUNDAY_SCHOOL_ID

beforeEach(() => {
  address.set(`id=${ID}`)
})

const renderPage = (locale: Locale = "en") =>
  renderWithProviders(<StageOverview />, { locale, me: me.administrator, sidebar: true })

function answer(stage: () => Response) {
  let requests = 0

  server.use(
    http.get(apiUrl(`/stages/${ID}`), () => {
      requests++

      return stage()
    }),
    http.get(apiUrl("/people"), () => HttpResponse.json(peopleList([])))
  )

  return () => requests
}

describe("the header", () => {
  test("names the service, the kind and the member count", async () => {
    answer(() => HttpResponse.json(thirdClass))
    renderPage()
    expect(await screen.findByRole("heading", { level: 1, name: "3rd Class" })).toBeInTheDocument()
    expect(screen.getByText("· Stage").parentElement).toHaveTextContent("Sunday School· Stage")
    expect(screen.getByText("14 members")).toBeInTheDocument()
    expect(screen.queryByText("Archived")).toBeNull()
    expect(screen.queryByText(/Servants:/)).toBeNull()
  })

  test("reads in German and shows an archived stage's badge", async () => {
    answer(() => HttpResponse.json({ ...thirdClass, archived: true }))
    renderPage("de")
    expect(await screen.findByText("14 Mitglieder")).toBeInTheDocument()
    expect(screen.getByText("Archiviert")).toBeInTheDocument()
  })
})

describe("the tabs", () => {
  test("link to the four routes; only Overview is current", async () => {
    answer(() => HttpResponse.json(thirdClass))
    renderPage()
    const tabs = within(await screen.findByRole("navigation", { name: "3rd Class sections" }))

    expect(tabs.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      `/stages/view/?id=${ID}`
    )

    expect(tabs.getByRole("link", { name: "Attendance" })).toHaveAttribute(
      "href",
      `/stages/attendance/?id=${ID}`
    )

    expect(tabs.getByRole("link", { name: "Lessons" })).toHaveAttribute(
      "href",
      `/stages/lessons/?id=${ID}`
    )

    expect(tabs.getByRole("link", { name: "Homework" })).toHaveAttribute(
      "href",
      `/stages/homework/?id=${ID}`
    )

    expect(tabs.getAllByRole("link").filter((link) => link.hasAttribute("aria-current"))).toEqual([
      tabs.getByRole("link", { name: "Overview" }),
    ])
  })
})

describe("useStageCrumbs", () => {
  function Crumbs({ tab, extra }: { tab: "overview" | "lessons"; extra?: { label: string }[] }) {
    const crumbs = useStageCrumbs(thirdClass, tab, extra)

    return <pre>{crumbs.map((crumb) => `${crumb.label}=${crumb.href ?? ""}`).join("\n")}</pre>
  }

  test("has four levels on Overview", () => {
    renderWithProviders(<Crumbs tab="overview" />)

    expect(screen.getByText(/Services/).textContent?.split("\n")).toEqual([
      "Services=/services/",
      `Sunday School=/services/view/?id=${SERVICE_ID}`,
      `Stages=/services/stages/?id=${SERVICE_ID}`,
      `3rd Class=/stages/view/?id=${ID}`,
    ])
  })

  test("adds the tab, then the extra crumbs", () => {
    renderWithProviders(<Crumbs tab="lessons" extra={[{ label: "The Good Samaritan" }]} />)

    expect(
      screen
        .getByText(/Services/)
        .textContent?.split("\n")
        .slice(4)
    ).toEqual([`Lessons=/stages/lessons/?id=${ID}`, "The Good Samaritan="])
  })
})

describe("missing stages and errors", () => {
  test("a 404 shows not found instead of the header and tabs", async () => {
    answer(() => problem(404, "notFound.stage"))
    renderPage()
    expect(await screen.findByText("This page doesn’t exist")).toBeInTheDocument()
    expect(screen.queryByRole("navigation", { name: /sections/ })).toBeNull()
  })

  test("a malformed id shows not found without asking the API", async () => {
    address.set("id=nope")
    const requests = answer(() => HttpResponse.json(thirdClass))
    renderPage()
    expect(await screen.findByText("This page doesn’t exist")).toBeInTheDocument()
    expect(requests()).toBe(0)
  })

  test("Retry after a 500 asks again", async () => {
    let failing = true
    answer(() => (failing ? problem(500, "internal") : HttpResponse.json(thirdClass)))
    renderPage()
    const retry = await screen.findByRole("button", { name: "Try again" })
    failing = false
    await userEvent.click(retry)
    expect(await screen.findByRole("heading", { level: 1, name: "3rd Class" })).toBeInTheDocument()
  })
})
