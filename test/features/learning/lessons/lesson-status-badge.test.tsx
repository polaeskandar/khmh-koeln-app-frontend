import { screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { renderWithProviders } from "@test/support/providers"

import { LessonStatusBadge } from "@/features/learning/lessons/lesson-status-badge"

describe("LessonStatusBadge", () => {
  test.each(["draft", "ready", "completed"] as const)(
    "lesson %s shows an icon and a label",
    (status) => {
      const { container } = renderWithProviders(<LessonStatusBadge status={status} />)
      expect(container.querySelector("svg")).not.toBeNull()
      expect(container.textContent).not.toBe("")
    }
  )

  test("an archived ready lesson reads 'Archived'", () => {
    renderWithProviders(<LessonStatusBadge status="ready" archived />)
    expect(screen.getByText("Archived")).toBeInTheDocument()
  })
})
