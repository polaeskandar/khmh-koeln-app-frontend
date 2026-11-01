import { http, HttpResponse } from "msw"
import { afterEach, describe, expect, test, vi } from "vitest"

import { apiUrl, problem } from "@test/support/api"
import { server } from "@test/support/msw"

import { apiRequest, onUnauthorized } from "@/lib/api/client"
import { ApiError } from "@/lib/api/problem"

const failure = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error("expected the request to fail")
    },
    (error: unknown) => error as ApiError
  )

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe("apiRequest", () => {
  test.each(["POST", "DELETE"] as const)(
    "a body-less %s sends {} as JSON with the cookie and no Authorization",
    async (method) => {
      let seen: Request | undefined
      let body: unknown

      server.use(
        http.all(apiUrl("/things/1"), async ({ request }) => {
          seen = request
          body = await request.json()

          return new HttpResponse(null, { status: 204 })
        })
      )

      const fetchSpy = vi.spyOn(globalThis, "fetch")
      await expect(apiRequest("/things/1", { method })).resolves.toBeUndefined()

      expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({
        credentials: "include",
        cache: "no-store",
      })

      fetchSpy.mockRestore()
      expect(seen?.method).toBe(method)
      expect(body).toEqual({})
      expect(seen?.headers.get("Content-Type")).toBe("application/json")
      expect(seen?.headers.get("Authorization")).toBeNull()
    }
  )

  test("GET sends no body and adds the query without empty values", async () => {
    let url = ""

    server.use(
      http.get(apiUrl("/people"), ({ request }) => {
        url = request.url

        return HttpResponse.json({ items: [] })
      })
    )

    await expect(
      apiRequest("/people", { query: { q: "Mina", page: 2, stage: null } })
    ).resolves.toEqual({
      items: [],
    })

    expect(new URL(url).search).toBe("?q=Mina&page=2")
  })

  test("a 422 keeps the field errors by dot path", async () => {
    server.use(
      http.post(apiUrl("/lessons"), () =>
        problem(422, "checkFields", {
          fieldErrors: { "materials.2.url": { code: "materials.url", params: {} } },
        })
      )
    )

    const error = await failure(apiRequest("/lessons", { method: "POST", body: {} }))
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 422, code: "checkFields" })
    expect(error.fieldErrors["materials.2.url"]).toEqual({ code: "materials.url", params: {} })
  })

  test("a 409 people.duplicate keeps its params and the candidates", async () => {
    const candidates = [
      { id: "c1", firstName: "Mina", lastName: "Hanna", displayName: null, groups: [] },
    ]

    server.use(
      http.post(apiUrl("/people"), () =>
        problem(409, "people.duplicate", { params: { count: 1, name: "Mina Hanna" }, candidates })
      )
    )

    const error = await failure(apiRequest("/people", { method: "POST" }))
    expect(error.params).toEqual({ count: 1, name: "Mina Hanna" })
    expect(error.extensions.candidates).toEqual(candidates)
  })

  test("Retry-After gives retryAfter in seconds", async () => {
    server.use(
      http.post(apiUrl("/auth/sign-in"), () =>
        problem(429, "auth.tooManyAttempts", { headers: { "Retry-After": "120" } })
      )
    )

    const error = await failure(apiRequest("/auth/sign-in", { method: "POST" }))
    expect(error).toMatchObject({ status: 429, code: "auth.tooManyAttempts", retryAfter: 120 })
  })

  test("a proxy's HTML error page has no code", async () => {
    server.use(
      http.get(apiUrl("/services"), () =>
        HttpResponse.html("<h1>502 Bad Gateway</h1>", { status: 502 })
      )
    )

    const error = await failure(apiRequest("/services"))
    expect(error).toMatchObject({ status: 502, code: null, params: {}, fieldErrors: {} })
  })

  test("a request that never reaches the API is status 0, network", async () => {
    server.use(http.get(apiUrl("/services"), () => HttpResponse.error()))
    const error = await failure(apiRequest("/services"))
    expect(error).toMatchObject({ status: 0, code: "network" })
  })

  test("a cancelled request rethrows the AbortError", async () => {
    server.use(http.get(apiUrl("/services"), () => new Promise(() => {})))
    const controller = new AbortController()
    const request = apiRequest("/services", { signal: controller.signal })
    controller.abort()
    await expect(request).rejects.toMatchObject({ name: "AbortError" })
  })
})

describe("onUnauthorized", () => {
  test("a 401 auth.unauthenticated notifies every listener once and still rejects", async () => {
    server.use(http.get(apiUrl("/me"), () => problem(401, "auth.unauthenticated")))
    const listener = vi.fn()
    const remove = onUnauthorized(listener)

    await expect(apiRequest("/me")).rejects.toMatchObject({
      status: 401,
      code: "auth.unauthenticated",
    })

    expect(listener).toHaveBeenCalledTimes(1)
    remove()
    await expect(apiRequest("/me")).rejects.toBeInstanceOf(ApiError)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  test("a wrong password at sign-in notifies no one", async () => {
    server.use(http.post(apiUrl("/auth/sign-in"), () => problem(401, "auth.invalidCredentials")))
    const listener = vi.fn()
    const remove = onUnauthorized(listener)

    await expect(apiRequest("/auth/sign-in", { method: "POST" })).rejects.toMatchObject({
      code: "auth.invalidCredentials",
    })

    expect(listener).not.toHaveBeenCalled()
    remove()
  })

  test("nothing about the session lands in web storage", async () => {
    server.use(http.get(apiUrl("/me"), () => HttpResponse.json({ id: "1" })))
    await apiRequest("/me")
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})
