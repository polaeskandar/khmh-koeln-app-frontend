import { expect, test } from "vitest"

import { DATA_REQUEST_QUERIES } from "@/features/privacy/data-requests/api"
import { refetchedBy } from "@test/support/queries"

test("a data request change refetches the requests", () => {
  expect(refetchedBy(DATA_REQUEST_QUERIES)).toEqual([
    "dataRequests",
    "dataRequest",
    "erasureReview",
  ])
})
