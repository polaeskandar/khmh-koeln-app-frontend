import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, test } from "vitest"

import { rawColours } from "@test/support/raw-colours"

const ALLOWED = [join("src", "components", "member-avatar.tsx")]

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      return path === join("src", "components", "ui") ? [] : sourceFiles(path)
    }

    return entry.name.endsWith(".tsx") && !ALLOWED.includes(path) ? [path] : []
  })
}

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
  const found = sourceFiles("src").flatMap((file) =>
    rawColours(readFileSync(file, "utf8")).map((cls) => `${file}: ${cls}`)
  )

  expect(found).toEqual([])
})
