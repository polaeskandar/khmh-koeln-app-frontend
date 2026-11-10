import { beforeEach, expect, test, vi } from "vitest"

const load = async () => {
  vi.resetModules()

  return import("@/features/identity/auth/auth-outcome")
}

beforeEach(() => window.sessionStorage.clear())

test("an outcome remembered before a reload is read back after it", async () => {
  ;(await load()).rememberOutcome("unconfirmed")
  expect((await load()).lastOutcome()).toBe("unconfirmed")
})

test("the erasure date survives a reload too", async () => {
  ;(await load()).rememberErasureScheduled("2026-11-24")
  const reloaded = await load()
  expect(reloaded.lastOutcome()).toBe("erasureScheduled")
  expect(reloaded.scheduledErasureOn()).toBe("2026-11-24")
})

test("forgetting it leaves nothing for the next reload", async () => {
  const first = await load()
  first.rememberOutcome("pending")
  first.forgetOutcome()
  expect((await load()).lastOutcome()).toBeNull()
})

test("a fresh tab has no outcome", async () => {
  expect((await load()).lastOutcome()).toBeNull()
})

test("a value that isn't an outcome is ignored", async () => {
  window.sessionStorage.setItem("khmk.authOutcome", '{"outcome":"approved","erasesOn":null}')
  expect((await load()).lastOutcome()).toBeNull()
})

test("without storage the outcome lives in memory", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked")
  })

  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked")
  })

  const outcome = await load()
  outcome.rememberOutcome("registered")
  expect(outcome.lastOutcome()).toBe("registered")
})
