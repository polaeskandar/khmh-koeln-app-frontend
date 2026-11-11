import { expect, test } from "vitest"

import { roleSummary } from "@/features/identity/auth/role-summary"
import { me } from "@test/support/fixtures/me"

test("roleSummary uses the API's role names and falls back to 'No role yet'", () => {
  expect(roleSummary(me.parent, "No role yet")).toBe("Parent")
  expect(roleSummary(me.noRoles, "No role yet")).toBe("No role yet")
})
