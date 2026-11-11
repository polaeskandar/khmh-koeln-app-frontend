import { expect, test } from "vitest"

import { fold, matchesQuery } from "@/lib/domain/names"

test("matchesQuery ignores accents and case", () => {
  const person = { firstName: "Mína", lastName: "Hánna", displayName: null }
  expect(matchesQuery(person, "MINA hanna")).toBe(true)
  expect(matchesQuery(person, "mina girgis")).toBe(false)
  expect(fold("  Kirollos  ÉLIAS ")).toBe("kirollos elias")
})
