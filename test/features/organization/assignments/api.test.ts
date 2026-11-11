import { expect, test } from "vitest"

import { ASSIGNMENT_QUERIES } from "@/features/organization/assignments/api"
import { refetchedBy } from "@test/support/queries"

test("an assignment refetches the staff accounts, the servants and the own account", () => {
  expect(refetchedBy(ASSIGNMENT_QUERIES)).toEqual([
    "me",
    "erasureRequest",
    "staffAccounts",
    "serviceServants",
  ])
})
