import { act, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { api, dataOf } from "@/lib/api/client"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import { RequireStaff } from "@/features/identity/guards"
import { safeNext } from "@/features/identity/safe-next"
import { SessionProvider, useSession } from "@/features/identity/session"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => vi.spyOn(toast, "error"))

afterEach(() => {
  vi.restoreAllMocks()
  router.replace.mockReset()
  window.history.replaceState(null, "", "/")
})

function SignOutButton() {
  const { signOut } = useSession()

  return <button onClick={() => signOut()}>Sign out</button>
}

async function signedIn() {
  server.use(http.get(apiUrl("/me"), () => HttpResponse.json(me.servant)))

  const view = renderWithProviders(
    <SessionProvider>
      <RequireStaff>
        <p>Members</p>
        <SignOutButton />
      </RequireStaff>
    </SessionProvider>
  )

  await screen.findByText("Members")

  return view
}

describe("when the session ends while working", () => {
  test("three parallel 401s give one toast and one redirect back here", async () => {
    window.history.replaceState(null, "", "/en/members/?q=Mina")
    const { client } = await signedIn()
    server.use(http.get(apiUrl("/people"), () => problem(401, "auth.unauthenticated")))

    await act(() =>
      Promise.allSettled([
        dataOf(api.GET("/people")),
        dataOf(api.GET("/people")),
        dataOf(api.GET("/people")),
      ])
    )

    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      "You were signed out. Sign in again to continue."
    )

    expect(router.replace).toHaveBeenCalledExactlyOnceWith(
      "/sign-in/?next=%2Fen%2Fmembers%2F%3Fq%3DMina"
    )

    expect(
      client
        .getQueryCache()
        .getAll()
        .filter((query) => query.state.data !== undefined)
    ).toEqual([])
  })

  test("the guarded page closes at once instead of showing the account that expired", async () => {
    await signedIn()

    server.use(
      http.get(apiUrl("/people"), () => problem(401, "auth.unauthenticated")),
      http.get(apiUrl("/me"), () => HttpResponse.json(me.servant))
    )

    await act(() => dataOf(api.GET("/people")).catch(() => {}))
    await waitFor(() => expect(screen.queryByText("Members")).toBeNull())
  })

  test("a 401 on the first load gives no toast", async () => {
    server.use(http.get(apiUrl("/me"), () => problem(401, "auth.unauthenticated")))

    renderWithProviders(
      <SessionProvider>
        <RequireStaff>
          <p>Members</p>
        </RequireStaff>
      </SessionProvider>
    )

    await waitFor(() => expect(router.replace).toHaveBeenCalledOnce())
    expect(toast.error).not.toHaveBeenCalled()
  })

  test("a 403 doesn't sign out", async () => {
    await signedIn()
    server.use(http.get(apiUrl("/people"), () => problem(403, "forbidden")))
    await act(() => dataOf(api.GET("/people")).catch(() => {}))
    expect(router.replace).not.toHaveBeenCalled()
    expect(screen.getByText("Members")).toBeInTheDocument()
  })
})

describe("signing out", () => {
  test("empties the cache and goes to sign-in; coming back shows the splash", async () => {
    let signedOut = false

    server.use(
      http.post(apiUrl("/auth/sign-out"), () => {
        signedOut = true

        return new HttpResponse(null, { status: 204 })
      }),
      http.get(apiUrl("/me"), () =>
        signedOut ? problem(401, "auth.unauthenticated") : HttpResponse.json(me.servant)
      )
    )

    const { client } = renderWithProviders(
      <SessionProvider>
        <RequireStaff>
          <p>Members</p>
          <SignOutButton />
        </RequireStaff>
      </SessionProvider>
    )

    await userEvent.click(await screen.findByRole("button", { name: "Sign out" }))
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/sign-in/"))
    expect(toast.error).not.toHaveBeenCalled()
    expect(client.getQueryCache().find({ queryKey: ["people"] })).toBeUndefined()
    expect(screen.queryByText("Members")).toBeNull()
  })

  test("a failed sign-out keeps the session and says why", async () => {
    await signedIn()
    server.use(http.post(apiUrl("/auth/sign-out"), () => HttpResponse.error()))
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "No connection. Check your internet connection and try again."
      )
    )

    expect(router.replace).not.toHaveBeenCalled()
    expect(screen.getByText("Members")).toBeInTheDocument()
  })

  test("web storage holds nothing about the session", async () => {
    await signedIn()
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})

describe("safeNext", () => {
  test.each([
    "//evil.example",
    "https://evil.example",
    "/\\evil",
    "javascript:alert(1)",
    "/xx/",
    "",
    "/en",
    "/en///evil.example/",
    "/de//evil.example",
    "/en/..//evil.example/",
    "/en/../ar//evil.example",
  ])("rejects %j", (next) => expect(safeNext(next)).toBeNull())

  test.each(["/en/members/", "/de/services/view/?id=1", "/ar/parent/"])("accepts %s", (next) =>
    expect(safeNext(next)).toBe(next)
  )
})
