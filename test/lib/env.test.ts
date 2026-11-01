import { describe, expect, test } from "vitest"

import { parseApiBaseUrl } from "@/lib/env"

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
