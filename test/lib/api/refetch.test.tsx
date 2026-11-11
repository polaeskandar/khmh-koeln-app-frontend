import { act, renderHook } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { testProviders } from "@test/support/providers"
import { isStale, useRefetch } from "@/lib/api/refetch"

describe("isStale", () => {
  test("a status in the list means the data changed meanwhile", () => {
    expect(isStale({ status: 409, code: "accounts.alreadyApproved" }, [409])).toBe(true)
    expect(isStale({ status: 404, code: "notFound.user" }, [409])).toBe(false)
  })

  test("so does a code in the list, whatever the status", () => {
    const signs = ["accounts.alreadyApproved", "notFound.user"]

    expect(isStale({ status: 404, code: "notFound.user" }, signs)).toBe(true)
    expect(isStale({ status: 409, code: "accounts.notPending" }, signs)).toBe(false)
  })

  test("a problem without a code matches only by status", () => {
    expect(isStale({ status: 409, code: null }, ["accounts.alreadyApproved"])).toBe(false)
    expect(isStale({ status: 409, code: null }, [409])).toBe(true)
  })
})

test("useRefetch invalidates every query under the given prefixes, and only those", async () => {
  const { client, wrapper } = testProviders()
  client.setQueryData(["roles", "list"], { items: [] })
  client.setQueryData(["staff-accounts", "list"], { items: [] })
  client.setQueryData(["services", "list"], { items: [] })
  const { result } = renderHook(() => useRefetch(), { wrapper })

  await act(() => result.current([["roles"], ["staff-accounts"]]))

  expect(client.getQueryState(["roles", "list"])?.isInvalidated).toBe(true)
  expect(client.getQueryState(["staff-accounts", "list"])?.isInvalidated).toBe(true)
  expect(client.getQueryState(["services", "list"])?.isInvalidated).toBe(false)
})
