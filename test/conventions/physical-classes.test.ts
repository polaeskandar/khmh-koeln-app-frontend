import { readFileSync } from "node:fs"

import { describe, expect, test } from "vitest"

import { physicalClasses } from "@test/support/physical-classes"
import { componentFiles } from "@test/support/source-files"

describe("the physical-class guard", () => {
  test.each([
    'className="ml-2"',
    'className="md:pr-4 text-sm"',
    'cn("left-0", x)',
    'className="text-right"',
    'className="rounded-l-md"',
    'className="border-r"',
    'className="-mr-1"',
  ])("rejects %s", (fixture) => {
    expect(physicalClasses(fixture)).not.toEqual([])
  })

  test.each([
    'className="ms-2"',
    'className="md:pe-4 text-sm"',
    'cn("start-0", x)',
    'className="text-end"',
    'className="rounded-s-md border-e"',
    'className="rtl:rotate-180 mx-2 px-4 inset-x-0 my-1"',
    'const copyright = "copyright-2026"',
  ])("accepts %s", (fixture) => {
    expect(physicalClasses(fixture)).toEqual([])
  })
})

test("no component outside components/ui uses a physical side", () => {
  const found = componentFiles().flatMap((file) =>
    physicalClasses(readFileSync(file, "utf8")).map((cls) => `${file}: ${cls}`)
  )

  expect(found).toEqual([])
})
