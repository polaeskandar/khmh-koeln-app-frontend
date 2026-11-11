import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { expect, test } from "vitest"

import type { ScheduleResponse } from "@/features/meetings/meetings/api"
import { apiUrl } from "@test/support/api"
import { schedule } from "@test/support/fixtures/schedules"
import { me } from "@test/support/fixtures/me"
import { services } from "@test/support/fixtures/services"
import { stageRef, sundaySchool } from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { address, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import { SchedulesPage } from "@/features/meetings/meetings/schedules-page"

const youth = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f11",
  name: "Youth Meeting",
  tone: 2,
  archived: false,
}

const choir = { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7e8f12", name: "Choir", tone: 3, archived: true }

const sundayWide = schedule({ name: "Liturgy breakfast", stage: null, startTime: "11:00" })
const fourth = schedule({ stage: stageRef("4th Class", 4) })

const first = schedule({
  stage: stageRef("1st Class", 1),
  nextDates: [{ date: "2026-11-08", startTime: "12:00", status: "scheduled", sessionId: null }],
})

const third = schedule({
  stage: stageRef("3rd Class", 2),
  nextDates: [{ date: "2026-11-08", startTime: "12:00", status: "active", sessionId: "s1" }],
})

const youthMeeting = schedule({
  name: "Wednesday evening",
  service: youth,
  stage: null,
  rosterMode: "open",
  startTime: "19:30",
  endTime: null,
  nextDates: [{ date: "2026-11-18", startTime: "19:30", status: "planned", sessionId: null }],
})

const choirPractice = schedule({ name: "Practice", service: choir, stage: null })

const pausedClass = schedule({
  stage: stageRef("Kindergarten", 0),
  active: false,
  generating: false,
})

const items: ScheduleResponse[] = [
  choirPractice,
  youthMeeting,
  fourth,
  first,
  sundayWide,
  third,
  pausedClass,
]

function open(query = "") {
  address.set(query)

  server.use(
    http.get(apiUrl("/schedules"), () => HttpResponse.json({ today: "2026-11-08", items })),
    http.get(apiUrl("/services"), () =>
      HttpResponse.json({
        ...services,
        items: [...services.items.filter((s) => s.name !== "Choir")],
      })
    )
  )

  renderWithProviders(<SchedulesPage />, { me: me.leader, sidebar: true })
}

const groups = async () => {
  await screen.findByRole("region", { name: "Sunday School" })

  return screen.getAllByRole("region")
}

const rows = (region: HTMLElement) => within(region).getAllByRole("listitem")

test("groups by service with archived ones last; service-wide first, then stage position", async () => {
  open()
  const regions = await groups()

  expect(regions.map((region) => region.getAttribute("aria-label"))).toEqual([
    "Sunday School",
    "Youth Meeting",
    "Choir",
  ])

  expect(rows(regions[0]).map((row) => row.textContent?.split("·")[0])).toEqual([
    "Sunday School",
    "1st Class",
    "3rd Class",
    "4th Class",
  ])
})

test("tabs count per status and keep the service; the filter keeps the status", async () => {
  open(`service=${sundaySchool.id}&status=inactive`)
  const statusNav = within(await screen.findByRole("navigation", { name: "Schedule status" }))

  expect(statusNav.getByRole("link", { name: "Active (4)" })).toHaveAttribute(
    "href",
    `/meetings/schedules/?service=${sundaySchool.id}`
  )

  expect(statusNav.getByRole("link", { name: "Inactive (1)" })).toHaveAttribute(
    "aria-current",
    "page"
  )

  expect(statusNav.getByRole("link", { name: "All" })).toHaveAttribute(
    "href",
    `/meetings/schedules/?status=all&service=${sundaySchool.id}`
  )

  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Service" }), "Youth Meeting")
  const youthId = services.items.find((service) => service.name === "Youth Meeting")!.id

  expect(router.push).toHaveBeenCalledWith(
    `/meetings/schedules/?status=inactive&service=${youthId}`
  )
})

test("all services count every schedule", async () => {
  open()
  const statusNav = within(await screen.findByRole("navigation", { name: "Schedule status" }))
  expect(statusNav.getByRole("link", { name: "Active (6)" })).toBeInTheDocument()
  expect(statusNav.getByRole("link", { name: "Inactive (1)" })).toBeInTheDocument()
})

test("labels the next date, the open session and inactive rows", async () => {
  open("status=all")
  const [sunday, youthGroup, choirGroup] = await groups()
  const row = (name: string) => rows(sunday).find((item) => item.textContent?.startsWith(name))
  expect(row("1st Class")).toHaveTextContent("Next: Today, 12:00")
  expect(row("3rd Class")).toHaveTextContent("Now: attendance open")
  expect(row("3rd Class")).toHaveTextContent("Roster: 9 people")
  expect(row("Sunday School")).toHaveTextContent("No upcoming date")
  expect(row("Kindergarten")).toHaveTextContent("Inactive")
  expect(rows(youthGroup)[0]).toHaveTextContent("Next: Wed 18 Nov, 19:30")
  expect(rows(youthGroup)[0]).toHaveTextContent("Open to everyone")
  expect(rows(choirGroup)[0]).toHaveTextContent("9 sessions so far")
})
