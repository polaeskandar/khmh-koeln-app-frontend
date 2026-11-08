import { screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import type { Report } from "@/features/parent/api"
import { CompletionControl } from "@/features/parent/completion-control"

const notDone: Report = { done: false, completedAt: null, completedBy: null, completedByYou: false }

const doneByCoParent: Report = {
  done: true,
  completedAt: "2026-11-08T12:00:00+01:00",
  completedBy: "Mina Girgis",
  completedByYou: false,
}

const control = (initial: Report) => (
  <CompletionControl
    today="2026-11-08"
    initial={initial}
    hint="Tap when Mimi has done it."
    undone="Marked as not done."
    reportDone={() => Promise.resolve(doneByCoParent)}
    undoReport={() => Promise.resolve()}
    invalidate={[]}
  />
)

test("a refreshed report replaces the one shown first", () => {
  const view = renderWithProviders(control(notDone))
  expect(screen.getByRole("button", { name: "Mark as done" })).toBeInTheDocument()
  view.rerender(control(doneByCoParent))
  expect(screen.queryByRole("button", { name: "Mark as done" })).toBeNull()
})
