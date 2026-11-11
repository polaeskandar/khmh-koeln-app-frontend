import { screen } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { expect, test } from "vitest"

import type { Locale } from "@/i18n/config"
import type { AgendaItem, Schedule, SessionView } from "@/features/meetings/meetings/api"
import { apiUrl } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { schedule } from "@test/support/fixtures/schedules"
import { services } from "@test/support/fixtures/services"
import { session, stageRef } from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import { AgendaPage } from "@/features/meetings/meetings/agenda-page"
import { SchedulesPage } from "@/features/meetings/meetings/schedules-page"

type Extra = Omit<NonNullable<Parameters<typeof session>[0]>, "counts"> & {
  counts?: SessionView["counts"]
}

const item = (stage: string, position: number, { counts, ...extra }: Extra = {}): AgendaItem => ({
  ...session({ stage: stageRef(stage, position), ...extra }),
  ...(counts !== undefined ? { counts } : {}),
  kind: "session",
})

function agenda(items: AgendaItem[], locale: Locale = "en") {
  server.use(
    http.get(apiUrl("/agenda"), () =>
      HttpResponse.json({ today: "2026-11-08", from: "2026-11-02", to: "2026-11-15", items })
    ),
    http.get(apiUrl("/services"), () => HttpResponse.json(services))
  )

  renderWithProviders(<AgendaPage />, { locale, me: me.leader, sidebar: true })
}

const rowOf = async (name: string) => (await screen.findByText(name)).closest("li")!

const counts = (rosterPresent: number, rosterSize: number, notOnRoster = 0) => ({
  present: rosterPresent + notOnRoster,
  rosterSize,
  rosterPresent,
  notMarked: rosterSize - rosterPresent,
  notOnRoster,
})

test("active and completed sessions show who was present", async () => {
  agenda([
    item("Kindergarten", 0, { status: "active", counts: counts(4, 11) }),
    item("1st Class", 1, { status: "completed", counts: counts(8, 12, 3) }),
    item("2nd Class", 2, { status: "canceled", counts: null }),
    item("4th Class", 4, { status: "scheduled", counts: counts(0, 14) }),
  ])

  expect(await rowOf("Kindergarten")).toHaveTextContent("4 of 11 present")
  expect(await rowOf("1st Class")).toHaveTextContent("8 of 12 present · +3 not on roster")
  expect(await rowOf("2nd Class")).not.toHaveTextContent("present")
  expect(await rowOf("4th Class")).not.toHaveTextContent("present")
})

test("an open roster reads only who came, and null counts render no line", async () => {
  agenda([
    item("Youth", 5, {
      status: "completed",
      rosterMode: "open",
      counts: { present: 12, rosterSize: null, rosterPresent: 0, notMarked: 0, notOnRoster: 0 },
    }),
    item("5th Class", 6, { status: "completed", counts: null }),
  ])

  expect(await rowOf("Youth")).toHaveTextContent("12 present")
  expect(await rowOf("5th Class")).not.toHaveTextContent("present")
})

test("in German", async () => {
  agenda([item("Kindergarten", 0, { status: "active", counts: counts(4, 11) })], "de")
  expect(await rowOf("Kindergarten")).toHaveTextContent("4 von 11 anwesend")
})

function schedules(items: Schedule[], locale: Locale = "en") {
  server.use(
    http.get(apiUrl("/schedules"), () => HttpResponse.json({ today: "2026-11-08", items })),
    http.get(apiUrl("/services"), () => HttpResponse.json(services))
  )

  renderWithProviders(<SchedulesPage />, { locale, me: me.leader, sidebar: true })
}

test("schedule rows show the roster size", async () => {
  schedules([
    schedule({ name: "Sunday class", stage: stageRef("3rd Class", 2), rosterSize: 9 }),
    schedule({ name: "Mentoring", stage: stageRef("1st Class", 1), rosterSize: 1 }),
    schedule({ name: "Open evening", stage: null, rosterMode: "open", rosterSize: null }),
  ])

  expect(await screen.findByText("Roster: 9 people")).toBeInTheDocument()
  expect(screen.getByText("Roster: 1 person")).toBeInTheDocument()
  expect(screen.getByText("Open to everyone")).toBeInTheDocument()
})

test("schedule roster sizes in German", async () => {
  schedules([schedule({ name: "Sunday class", rosterSize: 9 })], "de")
  expect(await screen.findByText("Liste: 9 Personen")).toBeInTheDocument()
})
