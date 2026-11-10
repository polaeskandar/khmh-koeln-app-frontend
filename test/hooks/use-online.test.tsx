import { act, renderHook } from "@testing-library/react"
import { expect, test, vi } from "vitest"

import { useOnline } from "@/hooks/use-online"

test("it follows the browser's connection events", () => {
  const onLine = vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(true)
  const { result } = renderHook(() => useOnline())
  expect(result.current).toBe(true)
  onLine.mockReturnValue(false)
  act(() => void window.dispatchEvent(new Event("offline")))
  expect(result.current).toBe(false)
  onLine.mockReturnValue(true)
  act(() => void window.dispatchEvent(new Event("online")))
  expect(result.current).toBe(true)
})
