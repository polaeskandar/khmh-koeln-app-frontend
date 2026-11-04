import { http, HttpResponse } from "msw"
import { afterEach, describe, expect, test, vi } from "vitest"

import { apiUrl, problem } from "@test/support/api"
import { server } from "@test/support/msw"

import { api, dataOf, onUnauthorized } from "@/lib/api/client"
import { ApiError } from "@/lib/api/problem"

const failure = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error("expected the request to fail")
    },
    (error: unknown) => error as ApiError
  )

const newPerson = {
  firstName: "Mina",
  lastName: "Hanna",
  displayName: null,
  placement: null,
  confirmDuplicate: false,
}

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe("the api client", () => {
  test("a DELETE without a body sends {} as JSON with the cookie and no Authorization", async () => {
    let seen: Request | undefined
    let body: unknown

    server.use(
      http.delete(apiUrl("/homework/h1"), async ({ request }) => {
        seen = request
        body = await request.json()

        return new HttpResponse(null, { status: 204 })
      })
    )

    const fetchSpy = vi.spyOn(globalThis, "fetch")

    await expect(
      dataOf(api.DELETE("/homework/{id}", { params: { path: { id: "h1" } } }))
    ).resolves.toBeUndefined()

    const sent = fetchSpy.mock.calls[0]?.[0] as Request
    expect(sent.credentials).toBe("include")
    expect(sent.cache).toBe("no-store")
    fetchSpy.mockRestore()
    expect(seen?.method).toBe("DELETE")
    expect(body).toEqual({})
    expect(seen?.headers.get("Content-Type")).toBe("application/json")
    expect(seen?.headers.get("Authorization")).toBeNull()
  })

  test("a write sends its body as JSON", async () => {
    let body: unknown

    server.use(
      http.post(apiUrl("/people"), async ({ request }) => {
        body = await request.json()

        return HttpResponse.json({ person: { id: "p1" }, membership: null }, { status: 201 })
      })
    )

    await dataOf(api.POST("/people", { body: newPerson }))
    expect(body).toEqual(newPerson)
  })

  test("GET sends no body and adds the query without empty values", async () => {
    let url = ""

    server.use(
      http.get(apiUrl("/people"), ({ request }) => {
        url = request.url

        return HttpResponse.json({ items: [] })
      })
    )

    await expect(
      dataOf(api.GET("/people", { params: { query: { q: "Mina", page: 2, stageId: undefined } } }))
    ).resolves.toEqual({ items: [] })

    expect(new URL(url).search).toBe("?q=Mina&page=2")
  })

  test("a 422 keeps the field errors by dot path", async () => {
    server.use(
      http.post(apiUrl("/people"), () =>
        problem(422, "checkFields", {
          fieldErrors: { "placement.stageId": { code: "people.stageNotFound", params: {} } },
        })
      )
    )

    const error = await failure(dataOf(api.POST("/people", { body: newPerson })))
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 422, code: "checkFields" })

    expect(error.fieldErrors["placement.stageId"]).toEqual({
      code: "people.stageNotFound",
      params: {},
    })
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

    const error = await failure(dataOf(api.POST("/people", { body: newPerson })))
    expect(error.params).toEqual({ count: 1, name: "Mina Hanna" })
    expect(error.extensions.candidates).toEqual(candidates)
  })

  test("Retry-After gives retryAfter in seconds", async () => {
    server.use(
      http.post(apiUrl("/auth/sign-in"), () =>
        problem(429, "auth.tooManyAttempts", { headers: { "Retry-After": "120" } })
      )
    )

    const error = await failure(
      dataOf(api.POST("/auth/sign-in", { body: { email: "a@b.de", password: "secret" } }))
    )

    expect(error).toMatchObject({ status: 429, code: "auth.tooManyAttempts", retryAfter: 120 })
  })

  test("a proxy's HTML error page has no code", async () => {
    server.use(
      http.get(apiUrl("/services"), () =>
        HttpResponse.html("<h1>502 Bad Gateway</h1>", { status: 502 })
      )
    )

    const error = await failure(dataOf(api.GET("/services")))
    expect(error).toMatchObject({ status: 502, code: null, params: {}, fieldErrors: {} })
  })

  test("a request that never reaches the API is status 0, network", async () => {
    server.use(http.get(apiUrl("/services"), () => HttpResponse.error()))
    const error = await failure(dataOf(api.GET("/services")))
    expect(error).toMatchObject({ status: 0, code: "network" })
  })

  test("a cancelled request rethrows the AbortError", async () => {
    server.use(http.get(apiUrl("/services"), () => new Promise(() => {})))
    const controller = new AbortController()
    const request = dataOf(api.GET("/services", { signal: controller.signal }))
    controller.abort()
    await expect(request).rejects.toMatchObject({ name: "AbortError" })
  })
})

describe("onUnauthorized", () => {
  test("a 401 auth.unauthenticated notifies every listener once and still rejects", async () => {
    server.use(http.get(apiUrl("/me"), () => problem(401, "auth.unauthenticated")))
    const listener = vi.fn()
    const remove = onUnauthorized(listener)

    await expect(dataOf(api.GET("/me"))).rejects.toMatchObject({
      status: 401,
      code: "auth.unauthenticated",
    })

    expect(listener).toHaveBeenCalledTimes(1)
    remove()
    await expect(dataOf(api.GET("/me"))).rejects.toBeInstanceOf(ApiError)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  test("a wrong password at sign-in notifies no one", async () => {
    server.use(http.post(apiUrl("/auth/sign-in"), () => problem(401, "auth.invalidCredentials")))
    const listener = vi.fn()
    const remove = onUnauthorized(listener)

    await expect(
      dataOf(api.POST("/auth/sign-in", { body: { email: "a@b.de", password: "wrong" } }))
    ).rejects.toMatchObject({ code: "auth.invalidCredentials" })

    expect(listener).not.toHaveBeenCalled()
    remove()
  })

  test("nothing about the session lands in web storage", async () => {
    server.use(http.get(apiUrl("/me"), () => HttpResponse.json({ id: "1" })))
    await dataOf(api.GET("/me"))
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})
