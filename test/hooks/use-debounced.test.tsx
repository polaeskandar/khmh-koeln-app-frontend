import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { useDebounced } from "@/hooks/use-debounced"

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test("the value follows after the delay, and only the last of several changes arrives", () => {
  const { result, rerender } = renderHook(({ text }) => useDebounced(text, 250), {
    initialProps: { text: "" },
  })

  rerender({ text: "mi" })
  act(() => vi.advanceTimersByTime(200))
  rerender({ text: "mina" })
  act(() => vi.advanceTimersByTime(200))
  expect(result.current).toBe("")
  act(() => vi.advanceTimersByTime(50))
  expect(result.current).toBe("mina")
})
