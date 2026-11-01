import { act, render, renderHook } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { fold, matchesQuery } from "@/lib/domain/names"

import { useNow, useToday } from "@/hooks/use-today"

function Today() {
  return <p>{useToday() ?? "server"}</p>
}

describe.each(["UTC", "America/New_York"])("with the device in %s", (zone) => {
  beforeEach(() => {
    vi.stubEnv("TZ", zone)
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] })
    vi.setSystemTime(new Date("2026-11-08T23:30:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  test("useToday is null on the server and Berlin's date after mount", () => {
    expect(renderToString(<Today />)).toBe("<p>server</p>")
    const { container } = render(<Today />)
    expect(container.textContent).toBe("2026-11-09")
  })

  test("useNow ticks every minute", () => {
    const { result } = renderHook(() => useNow())
    expect(result.current).toEqual({ date: "2026-11-09", time: "00:30" })

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(result.current).toEqual({ date: "2026-11-09", time: "00:31" })
  })
})

test("matchesQuery ignores accents and case", () => {
  const person = { firstName: "Mína", lastName: "Hánna", displayName: null }
  expect(matchesQuery(person, "MINA hanna")).toBe(true)
  expect(matchesQuery(person, "mina girgis")).toBe(false)
  expect(fold("  Kirollos  ÉLIAS ")).toBe("kirollos elias")
})
