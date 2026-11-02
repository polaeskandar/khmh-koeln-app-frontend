import { describe, expect, test } from "vitest"

import { parseApiBaseUrl, parseImpressumUrl } from "@/lib/env"

describe("parseApiBaseUrl", () => {
  test.each(["/api", "http://localhost:8000/api", "https://api.khmk-koeln.com/api"])(
    "accepts %s",
    (value) => expect(parseApiBaseUrl(value, { production: true })).toBe(value)
  )

  test.each(["api.example.org", "https://x/api/", "/api/", "ftp://x/api", "https://"])(
    "rejects %s",
    (value) =>
      expect(() => parseApiBaseUrl(value, { production: false })).toThrow(
        /NEXT_PUBLIC_API_BASE_URL/
      )
  )

  test("is required in production builds and defaults to the local API in development", () => {
    expect(() => parseApiBaseUrl(undefined, { production: true })).toThrow(/required/)
    expect(parseApiBaseUrl("", { production: false })).toBe("http://localhost:8000/api")
  })
})

describe("parseImpressumUrl", () => {
  test("accepts an absolute https URL", () =>
    expect(parseImpressumUrl("https://example.org/impressum", { production: true })).toBe(
      "https://example.org/impressum"
    ))

  test.each(["http://example.org/impressum", "/impressum", "example.org"])("rejects %s", (value) =>
    expect(() => parseImpressumUrl(value, { production: false })).toThrow(
      /NEXT_PUBLIC_IMPRESSUM_URL/
    )
  )

  test("is required in production builds and optional in development", () => {
    expect(() => parseImpressumUrl(undefined, { production: true })).toThrow(/required/)
    expect(parseImpressumUrl("", { production: false })).toBeNull()
  })
})
