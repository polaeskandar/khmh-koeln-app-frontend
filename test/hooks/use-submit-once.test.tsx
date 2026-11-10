import { renderHook } from "@testing-library/react"
import { expect, test, vi } from "vitest"

import { useSubmitOnce } from "@/hooks/use-submit-once"

function held<T>() {
  let release: (value: T) => void = () => {}
  let fail: (error: unknown) => void = () => {}

  const promise = new Promise<T>((resolve, reject) => {
    release = resolve
    fail = reject
  })

  return { promise, release, fail }
}

test("a second call while the first runs is ignored, and the next one runs again", async () => {
  const first = held<string>()
  const run = vi.fn<() => Promise<string>>().mockReturnValueOnce(first.promise)
  const { result } = renderHook(() => useSubmitOnce(run))
  const running = result.current()

  await expect(result.current()).resolves.toBeUndefined()
  expect(run).toHaveBeenCalledTimes(1)
  first.release("saved")
  await expect(running).resolves.toBe("saved")
  run.mockResolvedValueOnce("saved again")
  await expect(result.current()).resolves.toBe("saved again")
  expect(run).toHaveBeenCalledTimes(2)
})

test("a run that throws releases the lock", async () => {
  const run = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce("saved")

  const { result } = renderHook(() => useSubmitOnce(run))

  await expect(result.current()).rejects.toThrow("offline")
  await expect(result.current()).resolves.toBe("saved")
})

test("the arguments reach the run", async () => {
  const run = vi.fn(async (intent: "save" | "publish") => intent)
  const { result } = renderHook(() => useSubmitOnce(run))

  await expect(result.current("publish")).resolves.toBe("publish")
})

test("keepLocked keeps ignoring calls after the result it names", async () => {
  const run = vi.fn(async () => ({ ok: true }))
  const { result } = renderHook(() => useSubmitOnce(run, { keepLocked: (saved) => saved.ok }))

  await expect(result.current()).resolves.toEqual({ ok: true })
  await expect(result.current()).resolves.toBeUndefined()
  expect(run).toHaveBeenCalledTimes(1)
})
