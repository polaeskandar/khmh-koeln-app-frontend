import { act, fireEvent, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import type { ServiceStages } from "@/features/organization/services/api"
import { apiUrl, problem } from "@test/support/api"
import { stageRef } from "@test/support/fixtures/sessions"
import { SUNDAY_SCHOOL_ID } from "@test/support/fixtures/stages"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import { StagesManager } from "@/features/organization/stages/stages-manager"

const search = vi.hoisted(() => ({ value: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search.value) }))
vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

const ROW = 48

beforeEach(() => {
  search.value = `id=${SUNDAY_SCHOOL_ID}`
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "error")

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

afterEach(() => vi.restoreAllMocks())

const impact = { activeSchedules: 0, upcomingSessions: 0 }
const kindergarten = { ...stageRef("Kindergarten", 0), description: null, memberCount: 9, impact }
const first = { ...stageRef("1st Class", 1), description: null, memberCount: 11, impact }
const third = { ...stageRef("3rd Class", 2), description: null, memberCount: 14, impact }

const data = (stages = [kindergarten, first, third], manage = true): ServiceStages => ({
  service: { id: SUNDAY_SCHOOL_ID, name: "Sunday School", tone: 1, archived: false },
  stages,
  archivedStages: [],
  can: { manageStructure: manage },
})

function open(
  body: ServiceStages,
  answer: () => Response | Promise<Response> = () => new HttpResponse(null, { status: 204 })
) {
  const puts: unknown[] = []

  server.use(
    http.get(apiUrl(`/services/${SUNDAY_SCHOOL_ID}/stages`), () => HttpResponse.json(body)),
    http.put(apiUrl(`/services/${SUNDAY_SCHOOL_ID}/stages/order`), async ({ request }) => {
      puts.push(await request.json())

      return answer()
    })
  )

  renderWithProviders(
    <SidebarProvider>
      <StagesManager />
    </SidebarProvider>
  )

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

    return new HttpResponse(null, { status: 204 })
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

  await vi.waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "The stages changed while you were sorting them. Reload the page and try again."
    )
  )

  expect(names()).toEqual(["Kindergarten", "1st Class", "3rd Class"])
})

test("without manageStructure there are no grips or Move items", async () => {
  open(data(undefined, false))
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
