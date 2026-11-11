import { expect, test } from "vitest"

import { GUARDIAN_LINK_QUERIES } from "@/features/people/guardians/api"
import { refetchedBy } from "@test/support/queries"

test("a guardian link change refetches the links", () => {
  expect(refetchedBy(GUARDIAN_LINK_QUERIES)).toEqual(["guardianLinks"])
})
