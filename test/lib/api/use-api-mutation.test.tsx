import { useQuery } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { beforeEach, describe, expect, test, vi } from "vitest"

import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { server } from "@test/support/msw"
import { testProviders } from "@test/support/providers"

import { servicesQuery } from "@/features/organization/services/api"
import { api, dataOf } from "@/lib/api/client"
import { useApiMutation } from "@/lib/api/use-api-mutation"

const createService = (name: string) =>
  dataOf(api.POST("/services", { body: { name, description: null } }))

function setup(
  options: Parameters<typeof useApiMutation<[string], { id: string }>>[1] = {},
  locale: Locale = "en"
) {
  const { client, wrapper } = testProviders({ locale })
  const hook = renderHook(() => useApiMutation(createService, options), { wrapper })

  return { client, hook }
}

const answer = (response: () => Response) => {
  let calls = 0

  server.use(
    http.post(apiUrl("/services"), () => {
      calls++

      return response()
    })
  )

  return () => calls
}

beforeEach(() => {
  vi.spyOn(toast, "error")
  vi.spyOn(toast, "success")
})

describe("problems in the person's language", () => {
  test.each([
    ["en", "Choir has meeting history (12 sessions). Archive it instead of deleting it."],
    [
      "de",
      "Choir hat schon Termine (12 Termine). Archivieren Sie den Dienst, statt ihn zu löschen.",
    ],
  ] as const)("a 409 with params toasts its text in %s", async (locale, text) => {
    answer(() => problem(409, "services.hasHistory", { params: { name: "Choir", count: 12 } }))
    const { hook } = setup({}, locale)
    let result: Awaited<ReturnType<typeof hook.result.current.execute>> | undefined

    await act(async () => {
      result = await hook.result.current.execute("Choir")
    })

    expect(result).toMatchObject({ ok: false, problem: { status: 409, message: text } })
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(text)
    expect(hook.result.current.problem?.message).toBe(text)
  })

  test("a 422 puts the text on its field and toasts nothing", async () => {
    answer(() =>
      problem(422, "checkFields", {
        fieldErrors: { name: { code: "services.nameTaken", params: { name: "Choir" } } },
      })
    )

    const { hook } = setup()
    await act(() => hook.result.current.execute("Choir"))

    expect(hook.result.current.fieldErrors).toEqual({
      name: "A service called “Choir” already exists.",
    })

    expect(toast.error).not.toHaveBeenCalled()
  })

  test.each([
    ["an unknown 409 code", () => problem(409, "foo.bar"), "Not possible right now"],
    [
      "a failed connection",
      () => HttpResponse.error(),
      "No connection. Check your internet connection and try again.",
    ],
    [
      "a proxy's 503 page",
      () => HttpResponse.html("<h1>Down</h1>", { status: 503 }),
      "The app can’t be reached right now. Try again in a few minutes.",
    ],
  ])("%s falls back to the status text", async (_, response, text) => {
    answer(response)
    const { hook } = setup()
    await act(() => hook.result.current.execute("Choir"))
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(text)
  })

  test("a 401 auth.unauthenticated toasts nothing; the session provider takes over", async () => {
    answer(() => problem(401, "auth.unauthenticated"))
    const { hook } = setup()
    await act(() => hook.result.current.execute("Choir"))
    expect(hook.result.current.problem?.status).toBe(401)
    expect(toast.error).not.toHaveBeenCalled()
  })

  test("toastOnError: false leaves the problem to the screen", async () => {
    answer(() => problem(409, "services.nameTaken", { params: { name: "Choir" } }))
    const { hook } = setup({ toastOnError: false })
    await act(() => hook.result.current.execute("Choir"))
    expect(hook.result.current.problem?.message).toBe("A service called “Choir” already exists.")
    expect(toast.error).not.toHaveBeenCalled()
  })
})

describe("success", () => {
  test("toasts once, then refetches the given prefixes", async () => {
    answer(() => HttpResponse.json({ id: "s1" }, { status: 201 }))
    const onSuccess = vi.fn()

    const { client, hook } = setup({
      successMessage: (data) => `Created ${data.id}.`,
      invalidate: [["services"]],
      onSuccess,
    })

    const invalidate = vi.spyOn(client, "invalidateQueries")

    await act(async () => {
      expect(await hook.result.current.execute("Choir")).toEqual({ ok: true, data: { id: "s1" } })
    })

    expect(toast.success).toHaveBeenCalledExactlyOnceWith("Created s1.")
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: ["services"] })
    expect(onSuccess).toHaveBeenCalledWith({ id: "s1" })
  })

  test("awaitRefetch stays pending until the invalidated queries are fetched again", async () => {
    answer(() => HttpResponse.json({ id: "s1" }, { status: 201 }))
    let release = () => {}
    const refetched = new Promise<void>((resolve) => (release = resolve))
    let lists = 0
    const onSuccess = vi.fn()

    server.use(
      http.get(apiUrl("/services"), async () => {
        lists++

        if (lists > 1) {
          await refetched
        }

        return HttpResponse.json({ items: [] })
      })
    )

    const { wrapper } = testProviders()

    const { result } = renderHook(
      () => ({
        list: useQuery(servicesQuery),
        mutation: useApiMutation(createService, {
          invalidate: [["services"]],
          awaitRefetch: true,
          onSuccess,
        }),
      }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))
    let running: Promise<unknown> = Promise.resolve()

    act(() => {
      running = result.current.mutation.execute("Choir")
    })

    await waitFor(() => expect(lists).toBe(2))
    expect(result.current.mutation.pending).toBe(true)
    expect(onSuccess).not.toHaveBeenCalled()
    release()
    await act(() => running)
    expect(onSuccess).toHaveBeenCalledWith({ id: "s1" })
    await waitFor(() => expect(result.current.mutation.pending).toBe(false))
  })

  test("a failure invalidates nothing and is not retried", async () => {
    const calls = answer(() => problem(500, "internal"))
    const { client, hook } = setup({ invalidate: [["services"]] })
    const invalidate = vi.spyOn(client, "invalidateQueries")
    await act(() => hook.result.current.execute("Choir"))
    expect(calls()).toBe(1)
    expect(invalidate).not.toHaveBeenCalled()
  })
})

test("pending while the call runs; reset clears the problem", async () => {
  let release = () => {}

  server.use(
    http.post(apiUrl("/services"), async () => {
      await new Promise<void>((resolve) => (release = resolve))

      return problem(409, "services.nameTaken", { params: { name: "Choir" } })
    })
  )

  const { hook } = setup()
  let running: Promise<unknown> = Promise.resolve()

  act(() => {
    running = hook.result.current.execute("Choir")
  })

  await waitFor(() => expect(hook.result.current.pending).toBe(true))
  release()
  await act(() => running)
  expect(hook.result.current.pending).toBe(false)
  expect(hook.result.current.problem).not.toBeNull()
  act(() => hook.result.current.reset())
  expect(hook.result.current.problem).toBeNull()
})
