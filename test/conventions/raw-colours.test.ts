import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, test } from "vitest"

import { rawColours } from "@test/support/raw-colours"
import { componentFiles } from "@test/support/source-files"

const ALLOWED = [join("src", "components", "member-avatar.tsx")]

describe("the raw-colour guard", () => {
  test.each([
    'className="bg-white"',
    'className="text-black"',
    'cn("hover:bg-red-500")',
    'className="bg-[#2a78d6]"',
    'className="dark:bg-[oklch(0.3_0.04_165)]"',
  ])("rejects %s", (fixture) => expect(rawColours(fixture)).not.toEqual([]))

  test.each([
    'className="bg-background text-foreground"',
    'className="bg-success-soft text-warning border-destructive/30"',
    'className="bg-primary/35 ring-foreground/10"',
    'className="text-xs bg-muted"',
  ])("accepts %s", (fixture) => expect(rawColours(fixture)).toEqual([]))
})

test("no component outside components/ui paints with raw colours", () => {
  const found = componentFiles("src", ALLOWED).flatMap((file) =>
    rawColours(readFileSync(file, "utf8")).map((cls) => `${file}: ${cls}`)
  )

  expect(found).toEqual([])
})
