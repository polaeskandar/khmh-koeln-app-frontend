import { act, fireEvent, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, expect, test, vi } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import type { StageList } from "@/features/organization/services/api"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { stageRef } from "@test/support/fixtures/sessions"
import { SUNDAY_SCHOOL_ID } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import { address } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import { expectToast } from "@test/support/toasts"
import { StagesManagerPage } from "@/features/organization/stages/stages-manager-page"

const ROW = 48

beforeEach(() => {
  address.set(`id=${SUNDAY_SCHOOL_ID}`)

  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement
  ) {
    const row = this.closest("tbody tr")
    const index = row?.parentElement ? [...row.parentElement.children].indexOf(row) : 0
    const top = row ? index * ROW : 0
    const height = row ? ROW : 10 * ROW

    return {
      x: 0,
      y: top,
      top,
      left: 0,
      width: 600,
      height,
      bottom: top + height,
      right: 600,
      toJSON: () => ({}),
    } as DOMRect
  })
})

const impact = { activeSchedules: 0, upcomingSessions: 0 }
const kindergarten = { ...stageRef("Kindergarten", 0), description: null, memberCount: 9, impact }
const first = { ...stageRef("1st Class", 1), description: null, memberCount: 11, impact }
const third = { ...stageRef("3rd Class", 2), description: null, memberCount: 14, impact }

const data = (stages = [kindergarten, first, third]): StageList => ({
  service: { id: SUNDAY_SCHOOL_ID, name: "Sunday School", tone: 1, archived: false },
  stages,
  archivedStages: [],
})

function open(
  body: StageList,
  answer: () => Response | Promise<Response> = () => HttpResponse.json(body),
  viewer: Me = me.leader
) {
  const puts: unknown[] = []

  server.use(
    http.get(apiUrl(`/services/${SUNDAY_SCHOOL_ID}/stages`), () => HttpResponse.json(body)),
    http.put(apiUrl(`/services/${SUNDAY_SCHOOL_ID}/stages/order`), async ({ request }) => {
      puts.push(await request.json())

      return answer()
    })
  )

  renderWithProviders(<StagesManagerPage />, { me: viewer, sidebar: true })

  return puts
}

const names = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getByRole("link").textContent)

test("space, arrow down, space on the first grip moves it and sends one PUT", async () => {
  const puts = open(data())
  const grip = await screen.findByRole("button", { name: "Drag to reorder Kindergarten" })
  grip.focus()
  fireEvent.keyDown(grip, { code: "Space", key: " " })
  await vi.waitFor(() => expect(document.body).toHaveTextContent("Kindergarten was moved to"))
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  fireEvent.keyDown(grip, { code: "ArrowDown", key: "ArrowDown" })

  await vi.waitFor(() =>
    expect(document.body).toHaveTextContent("Kindergarten was moved to position 2 of 3.")
  )

  fireEvent.keyDown(grip, { code: "Space", key: " " })
  await vi.waitFor(() => expect(puts).toHaveLength(1))
  expect(puts[0]).toEqual({ stageIds: [first.id, kindergarten.id, third.id] })
  expect(names()).toEqual(["1st Class", "Kindergarten", "3rd Class"])

  expect(
    await screen.findByText(/Kindergarten was dropped at position 2 of 3\./)
  ).toBeInTheDocument()
})

test("Move down on the first row reorders, and the ends are disabled", async () => {
  const puts = open(data())
  await userEvent.click(await screen.findByRole("button", { name: "Actions for Kindergarten" }))

  expect(await screen.findByRole("menuitem", { name: "Move up" })).toHaveAttribute(
    "aria-disabled",
    "true"
  )

  await userEvent.click(screen.getByRole("menuitem", { name: "Move down" }))
  await vi.waitFor(() => expect(puts).toHaveLength(1))
  expect(puts[0]).toEqual({ stageIds: [first.id, kindergarten.id, third.id] })
  await userEvent.click(screen.getByRole("button", { name: "Actions for 3rd Class" }))

  expect(await screen.findByRole("menuitem", { name: "Move down" })).toHaveAttribute(
    "aria-disabled",
    "true"
  )
})

test("Move items are disabled while saving", async () => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => (release = resolve))

  open(data(), async () => {
    await gate

    return HttpResponse.json(data())
  })

  await userEvent.click(await screen.findByRole("button", { name: "Actions for Kindergarten" }))
  await userEvent.click(await screen.findByRole("menuitem", { name: "Move down" }))
  await userEvent.click(screen.getByRole("button", { name: "Actions for 3rd Class" }))

  expect(await screen.findByRole("menuitem", { name: "Move up" })).toHaveAttribute(
    "aria-disabled",
    "true"
  )

  release()
})

test("a stale order rolls back and says why", async () => {
  open(data(), () => problem(409, "stages.reorderStale"))
  await userEvent.click(await screen.findByRole("button", { name: "Actions for Kindergarten" }))
  await userEvent.click(await screen.findByRole("menuitem", { name: "Move down" }))

  await expectToast(
    "The stages changed while you were sorting them. Reload the page and try again."
  )

  expect(names()).toEqual(["Kindergarten", "1st Class", "3rd Class"])
})

test("without stages: update there are no grips or Move items", async () => {
  open(data(), undefined, me.servant)
  await screen.findByRole("table")
  expect(screen.queryByRole("button", { name: /Drag to reorder/ })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: /Actions for/ })).not.toBeInTheDocument()
  expect(screen.queryByText(/Drag the rows/)).not.toBeInTheDocument()
})

test("the hint shows with two or more stages, not with one", async () => {
  open(data([kindergarten]))
  await screen.findByRole("table")
  expect(screen.queryByText(/Drag the rows/)).not.toBeInTheDocument()
})
