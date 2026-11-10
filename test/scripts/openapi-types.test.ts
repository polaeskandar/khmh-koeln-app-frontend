import { resolve } from "node:path"

import { describe, expect, test } from "vitest"

import { documentText, typesFrom } from "../../scripts/openapi-types.mjs"

const COPY = resolve("openapi/openapi.json")
const TYPES = resolve("src/lib/api/schema.d.ts")

const document = {
  openapi: "3.1.0",
  info: { title: "KHMK Köln API", version: "1.0.0" },
  paths: {
    "/api/me": {
      get: {
        tags: ["Account"],
        description: "The signed-in account.",
        responses: { "200": { description: "The account." } },
      },
    },
  },
}

describe("typesFrom", () => {
  test("drops the /api prefix that the base URL already holds", async () => {
    const types = await typesFrom(document, TYPES)

    expect(types).toContain('"/me": {')
    expect(types).not.toContain("/api/me")
  })

  test("leaves out the descriptions", async () => {
    expect(await typesFrom(document, TYPES)).not.toContain("The signed-in account.")
  })
})

describe("documentText", () => {
  test("keeps the document unchanged, formatted as the repository formats JSON", async () => {
    const text = await documentText(document, COPY)

    expect(JSON.parse(text)).toEqual(document)
    expect(text).toContain('"title": "KHMK Köln API"')
    expect(text).toContain('"tags": ["Account"]')
  })
})
