import { screen, within } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"

import type { HistoryEntry } from "@/features/meetings/meetings/api"
import { AGENDA_TODAY } from "@test/support/fixtures/agenda"
import { renderWithProviders } from "@test/support/providers"
import { HistoryTimeline } from "@/features/meetings/meetings/history-timeline"

afterEach(() => vi.unstubAllEnvs())

describe("HistoryTimeline", () => {
  const entries: HistoryEntry[] = [
    {
      type: "created",
      at: "2026-11-07T03:00:00+01:00",
      actor: null,
      byGenerator: true,
      note: null,
    },
    {
      type: "canceled",
      at: "2026-11-08T10:00:00+01:00",
      actor: null,
      byGenerator: false,
      note: "Bishop's visit",
    },
  ]

  test.each(["UTC", "America/Los_Angeles"])("reads the same with the device in %s", (zone) => {
    vi.stubEnv("TZ", zone)
    renderWithProviders(<HistoryTimeline entries={entries} today={AGENDA_TODAY} />)
    const [created, canceled] = screen.getAllByRole("listitem")
    expect(created).toHaveTextContent("Created from the schedule, the day before")
    expect(within(created).queryByText(/·/)).toBeNull()
    expect(canceled).toHaveTextContent("Former account")
    expect(within(canceled).getByText("Bishop's visit")).toHaveAttribute("dir", "auto")
  })

  test("a one-off session was created by hand", () => {
    renderWithProviders(
      <HistoryTimeline
        oneOff
        today={AGENDA_TODAY}
        entries={[
          {
            type: "created",
            at: "2026-11-07T10:00:00+01:00",
            actor: { id: "a1", name: "Mina" },
            byGenerator: false,
            note: null,
          },
        ]}
      />
    )

    expect(screen.getByText("Created by hand as a one-off session")).toBeInTheDocument()
  })
})
