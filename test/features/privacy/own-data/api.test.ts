import { expect, test } from "vitest"

import { ERASURE_REQUEST_QUERIES } from "@/features/privacy/own-data/api"
import { refetchedBy } from "@test/support/queries"

test("an erasure request made meanwhile refetches the own erasure request", () => {
  expect(refetchedBy(ERASURE_REQUEST_QUERIES)).toEqual(["erasureRequest"])
})
