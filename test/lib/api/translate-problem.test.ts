import { describe, expect, test } from "vitest"

import { ApiError } from "@/lib/api/problem"
import {
  fieldErrorsOf,
  type ProblemTranslator,
  translateProblem,
} from "@/lib/api/translate-problem"

const known = new Set(["errors.services.nameTaken", "errors.validation.tooLong"])

const t = Object.assign(
  (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
  { has: (key: string) => known.has(key) }
) as ProblemTranslator

describe("translateProblem", () => {
  test("uses errors.<code> with the params when the catalog has it", () => {
    const error = new ApiError({
      status: 409,
      code: "services.nameTaken",
      params: { name: "Choir" },
    })

    expect(translateProblem(error, t)).toBe('errors.services.nameTaken {"name":"Choir"}')
  })

  test.each([
    [0, "errors.network"],
    [401, "errors.auth.unauthenticated"],
    [403, "errors.forbidden"],
    [404, "errors.title.notFound"],
    [409, "errors.title.conflict"],
    [422, "errors.checkFields"],
    [429, "errors.tooManyRequests"],
    [503, "errors.unavailable"],
    [500, "errors.internal"],
    [502, "errors.internal"],
    [400, "errors.invalidRequest"],
    [415, "errors.invalidRequest"],
  ])("falls back to the text for status %i", (status, key) => {
    expect(translateProblem(new ApiError({ status, code: "foo.bar" }), t)).toBe(key)
    expect(translateProblem(new ApiError({ status, code: null }), t)).toBe(key)
  })
})

test("fieldErrorsOf translates each field by dot path", () => {
  const error = new ApiError({
    status: 422,
    code: "checkFields",
    fieldErrors: {
      "materials.2.label": { code: "validation.tooLong", params: { max: 120 } },
      colour: { code: "foo.unknown", params: {} },
    },
  })

  expect(fieldErrorsOf(error, t)).toEqual({
    "materials.2.label": 'errors.validation.tooLong {"max":120}',
    colour: "errors.checkFields",
  })
})
