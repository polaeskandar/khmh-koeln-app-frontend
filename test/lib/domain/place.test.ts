import { expect, test } from "vitest"

import { placeLabel } from "@/lib/domain/place"

test("a stage reads after its service", () => {
  expect(placeLabel({ service: { name: "Sunday School" }, stage: { name: "Grade 3" } })).toBe(
    "Sunday School · Grade 3"
  )
})

test("a whole service reads as its name", () => {
  expect(placeLabel({ service: { name: "Choir" }, stage: null })).toBe("Choir")
})
