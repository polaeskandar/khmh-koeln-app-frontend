import { screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { AGENDA_TODAY, agendaSession, plannedDate } from "@test/support/fixtures/agenda"
import { physicalClasses } from "@test/support/physical-classes"
import { renderWithProviders } from "@test/support/providers"

import { AgendaRow } from "@/features/meetings/meetings/agenda-row"
import { SessionCardView } from "@/features/meetings/meetings/session-card"

describe("AgendaRow", () => {
  test("a planned date says when its session is created: the day before, never in the past", () => {
    renderWithProviders(
      <>
        <AgendaRow item={plannedDate("2026-11-09")} today={AGENDA_TODAY} />
        <AgendaRow item={plannedDate("2026-11-15")} today={AGENDA_TODAY} />
      </>
    )

    expect(screen.getByText("Created today")).toBeInTheDocument()
    expect(screen.getByText("Created on Sat 14 Nov")).toBeInTheDocument()
  })

  test("a canceled row is struck through, with its reason in its own direction", () => {
    renderWithProviders(
      <AgendaRow
        item={agendaSession({ status: "canceled", cancelReason: "زيارة الأسقف" })}
        today={AGENDA_TODAY}
      />
    )

    expect(screen.getByText("3rd Class")).toHaveClass("line-through")
    expect(screen.getByText("زيارة الأسقف")).toHaveAttribute("dir", "auto")
  })

  test("no count line without counts; with counts, the present line", () => {
    const { unmount } = renderWithProviders(
      <AgendaRow item={agendaSession({ status: "completed" })} today={AGENDA_TODAY} />
    )

    expect(screen.queryByText(/present/)).toBeNull()
    unmount()

    renderWithProviders(
      <AgendaRow
        item={agendaSession({
          status: "completed",
          counts: { present: 10, rosterSize: 14, rosterPresent: 9, notMarked: 5, notOnRoster: 1 },
        })}
        today={AGENDA_TODAY}
      />
    )

    expect(screen.getByText("9 of 14 present · +1 not on roster")).toBeInTheDocument()
  })
})

test("in Arabic nothing uses a physical side", () => {
  const { container } = renderWithProviders(
    <>
      <AgendaRow
        item={agendaSession({ status: "canceled", cancelReason: "سبب" })}
        today={AGENDA_TODAY}
      />
      <AgendaRow item={plannedDate("2026-11-15")} today={AGENDA_TODAY} />
      <SessionCardView
        session={agendaSession({
          status: "active",
          counts: { present: 9, rosterSize: 14, rosterPresent: 9, notMarked: 5, notOnRoster: 0 },
        })}
        today={AGENDA_TODAY}
      />
    </>,
    { locale: "ar" }
  )

  const classes = [...container.querySelectorAll("[class]")].map(
    (el) => `"${el.getAttribute("class")}"`
  )

  expect(classes.flatMap((c) => physicalClasses(c))).toEqual([])
})
