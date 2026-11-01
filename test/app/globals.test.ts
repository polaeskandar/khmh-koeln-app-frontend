import { readFileSync } from "node:fs"

import { describe, expect, test } from "vitest"

const css = readFileSync("src/app/globals.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "")

function variablesOf(selector: ":root" | ".dark") {
  const head = selector === ":root" ? ":root" : "\\.dark"

  const blocks = [...css.matchAll(new RegExp(`^${head}\\s*\\{([^}]*)\\}`, "gm"))].map(
    ([, body]) => body
  )

  return new Set(
    blocks.flatMap((body) => [...body.matchAll(/(--[\w-]+):/g)].map(([, name]) => name))
  )
}

const STATUS = ["success", "info", "warning"].flatMap((tone) => [
  `--${tone}`,
  `--${tone}-foreground`,
  `--${tone}-soft`,
])

const IDENTITY = Array.from({ length: 8 }, (_, i) => `--identity-${i + 1}`)

describe.each([":root", ".dark"] as const)("globals.css %s", (selector) => {
  test("defines the status tokens, danger-soft and the eight identity colours", () => {
    const defined = variablesOf(selector)

    for (const name of [...STATUS, "--danger-soft", ...IDENTITY]) {
      expect(defined).toContain(name)
    }
  })
})

test("@theme maps the status tokens to Tailwind colours", () => {
  for (const name of [...STATUS, "--danger-soft"]) {
    expect(css).toContain(`--color-${name.slice(2)}: var(${name});`)
  }
})
