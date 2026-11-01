import { describe, expect, test } from "vitest"

import { addDays, localDateOf, toInstant, zonedInstant } from "@/lib/domain/time"

describe("Europe/Berlin", () => {
  test("an instant's local date is Berlin's, not UTC's", () => {
    expect(localDateOf("2026-11-08T23:30:00Z")).toBe("2026-11-09")
  })

  test("a time in the spring-forward gap moves forward by the gap, as in PHP", () => {
    expect(toInstant(zonedInstant("2027-03-28", "02:30"))).toBe("2027-03-28T03:30:00+02:00")
  })

  test("an ambiguous autumn time takes the later, standard-time occurrence, as in PHP", () => {
    expect(toInstant(zonedInstant("2026-10-25", "02:30"))).toBe("2026-10-25T02:30:00+01:00")
  })

  test("addDays counts calendar days across both changes", () => {
    expect(addDays("2027-03-27", 1)).toBe("2027-03-28")
    expect(addDays("2027-03-28", 1)).toBe("2027-03-29")
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26")
    expect(addDays("2026-10-26", -2)).toBe("2026-10-24")
  })
})
