import { expect, test } from "vitest"

import { oneOf } from "@/lib/one-of"

test("a value among the options comes back typed as one of them", () => {
  expect(oneOf(["upcoming", "previous"] as const, "previous")).toBe("previous")
  expect(oneOf([1, 2, 3] as const, 2)).toBe(2)
})

test("any other value gives undefined", () => {
  expect(oneOf(["upcoming", "previous"] as const, "archived")).toBeUndefined()
  expect(oneOf([1, 2, 3] as const, "2")).toBeUndefined()
  expect(oneOf(["upcoming", "previous"] as const, null)).toBeUndefined()
})
