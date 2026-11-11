import { expect, test } from "vitest"

import { fold, initials, initialsOf, matchesQuery } from "@/lib/domain/names"

test("matchesQuery ignores accents and case", () => {
  const person = { firstName: "Mína", lastName: "Hánna", displayName: null }
  expect(matchesQuery(person, "MINA hanna")).toBe(true)
  expect(matchesQuery(person, "mina girgis")).toBe(false)
  expect(fold("  Kirollos  ÉLIAS ")).toBe("kirollos elias")
})

test.each([
  ["Hoda Farag", "HF"],
  ["  mina   abd el malak ", "MM"],
  ["Mariam", "M"],
  ["", ""],
])("initialsOf(%j) is %j", (name, expected) => {
  expect(initialsOf(name)).toBe(expected)
})

test("initials take the display name before the first name, and the last name", () => {
  expect(initials({ firstName: "Kirollos", lastName: "Iskander", displayName: null })).toBe("KI")
  expect(initials({ firstName: "Kirollos", lastName: "Iskander", displayName: "Kiro" })).toBe("KI")
  expect(initials({ firstName: "Anna", lastName: "van Dyke", displayName: null })).toBe("AV")
})
