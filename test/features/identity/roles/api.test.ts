import { expect, test } from "vitest"

import { ROLE_QUERIES } from "@/features/identity/roles/api"
import { refetchedBy } from "@test/support/queries"

test("a role change refetches the roles, the staff accounts and the own account", () => {
  expect(refetchedBy(ROLE_QUERIES)).toEqual([
    "me",
    "erasureRequest",
    "staffAccounts",
    "roles",
    "role",
  ])
})
