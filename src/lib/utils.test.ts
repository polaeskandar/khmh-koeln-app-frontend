import { expect, test } from "vitest"

import { cn } from "./utils"

test("cn keeps the last of conflicting Tailwind classes and drops falsy ones", () => {
  expect(cn("px-2 text-sm", false, "px-4", undefined)).toBe("text-sm px-4")
})
