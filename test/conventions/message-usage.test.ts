import { expect, test } from "vitest"

import { unusedMessageKeys } from "../../scripts/message-usage.mjs"

test("every message key is read somewhere in src", async () => {
  expect(await unusedMessageKeys(process.cwd())).toEqual([])
})
