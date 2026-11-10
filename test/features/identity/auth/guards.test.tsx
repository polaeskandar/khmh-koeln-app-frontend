import { useQuery } from "@tanstack/react-query"
import { screen, waitFor } from "@testing-library/react"

import { http, HttpResponse } from "msw"
import type { ReactNode } from "react"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, test } from "vitest"

import { api, dataOf } from "@/lib/api/client"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders, testProviders } from "@test/support/providers"

import type { Me } from "@/features/identity/auth/api"
import {
  RedirectIfSignedIn,
  RequireParent,
  RequirePermission,
  RequireStaff,
} from "@/features/identity/auth/guards"
import { SessionProvider, useCan } from "@/features/identity/auth/session"

afterEach(() => {
  window.history.replaceState(null, "", "/")
})

const answerMe = (account: Me | null) =>
  server.use(
    http.get(apiUrl("/me"), () =>
      account ? HttpResponse.json(account) : problem(401, "auth.unauthenticated")
    )
  )

function guarded(Guard: (props: { children: ReactNode }) => ReactNode) {
  return renderWithProviders(
    <SessionProvider>
      <Guard>
        <p>Guarded page</p>
      </Guard>
    </SessionProvider>
  )
}

const SIGN_IN = "/sign-in/?next=%2Fen%2Fmembers%2F"

describe.each([
  ["the staff layout", RequireStaff, { staff: "page", parent: "/parent/" }],
  ["the parent portal", RequireParent, { staff: "/", parent: "page" }],
] as const)("%s", (_, Guard, home) => {
  test.each([
    ["anonymous", null, SIGN_IN],
    ["administrator", me.administrator, home.staff],
    ["service leader", me.leader, home.staff],
    ["servant", me.servant, home.staff],
    ["parent", me.parent, home.parent],
    ["staff and parent", me.staffAndParent, "page"],
    ["church office", me.churchOffice, home.staff],
    ["attendance only", me.attendanceOnly, home.staff],
    ["no roles", me.noRoles, "no role"],
  ] as const)("%s → %s", async (_, account, outcome) => {
    window.history.replaceState(null, "", "/en/members/")
    answerMe(account)
    guarded(Guard)

    if (outcome === "page") {
      expect(await screen.findByText("Guarded page")).toBeInTheDocument()
      expect(router.replace).not.toHaveBeenCalled()
    } else if (outcome === "no role") {
      expect(await screen.findByText("Your account has no role yet")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument()
    } else {
      await waitFor(() => expect(router.replace).toHaveBeenCalledExactlyOnceWith(outcome))
      expect(screen.queryByText("Guarded page")).toBeNull()
    }
  })
})

describe("RequirePermission", () => {
  function MembersList() {
    const people = useQuery({
      queryKey: ["people"],
      queryFn: () => dataOf(api.GET("/people")),
    })

    return <p>{people.data ? "Members" : "Loading members"}</p>
  }

  function membersPage() {
    let requests = 0

    server.use(
      http.get(apiUrl("/people"), () => {
        requests++

        return HttpResponse.json({ items: [] })
      })
    )

    renderWithProviders(
      <SessionProvider>
        <RequireStaff>
          <RequirePermission action="read" resource="members">
            <MembersList />
          </RequirePermission>
        </RequireStaff>
      </SessionProvider>
    )

    return () => requests
  }

  test("shows the page with the permission", async () => {
    answerMe(me.churchOffice)
    membersPage()
    expect(await screen.findByText("Members")).toBeInTheDocument()
  })

  test("shows NoAccess without it and never asks for the list", async () => {
    answerMe(me.attendanceOnly)
    const requests = membersPage()
    expect(await screen.findByText("Not allowed")).toBeInTheDocument()
    expect(screen.getByText("Your roles don’t allow this.")).toBeInTheDocument()
    expect(requests()).toBe(0)
    expect(router.replace).not.toHaveBeenCalled()
  })

  test("a servant without a group is told to ask the church office and never asks", async () => {
    answerMe({ ...me.servant, assignments: [] })
    const requests = membersPage()
    expect(await screen.findByText("You are not assigned to a group yet")).toBeInTheDocument()
    expect(screen.queryByText("Not allowed")).toBeNull()
    expect(requests()).toBe(0)
  })
})

test("useCan is false once a 401 has ended the session", async () => {
  answerMe(me.administrator)
  function Probe() {
    const can = useCan()

    return <p>{can("update", "roles") ? "may update roles" : "may not update roles"}</p>
  }

  const page = () => (
    <SessionProvider>
      <Probe />
    </SessionProvider>
  )

  const { rerender } = renderWithProviders(page())
  expect(await screen.findByText("may update roles")).toBeInTheDocument()
  answerMe(null)
  server.use(http.get(apiUrl("/services"), () => problem(401, "auth.unauthenticated")))
  await dataOf(api.GET("/services")).catch(() => {})
  rerender(page())
  expect(await screen.findByText("may not update roles")).toBeInTheDocument()
})

test.each([
  ["anonymous", null, "page"],
  ["servant", me.servant, "/"],
  ["parent", me.parent, "/parent/"],
] as const)("RedirectIfSignedIn: %s → %s", async (_, account, outcome) => {
  answerMe(account)
  guarded(RedirectIfSignedIn)

  if (outcome === "page") {
    expect(await screen.findByText("Guarded page")).toBeInTheDocument()
  } else {
    await waitFor(() => expect(router.replace).toHaveBeenCalledExactlyOnceWith(outcome))
  }
})

test("no child query runs before the role is known", async () => {
  let release = () => {}

  server.use(
    http.get(apiUrl("/me"), async () => {
      await new Promise<void>((resolve) => (release = resolve))

      return HttpResponse.json(me.servant)
    })
  )

  let childRequests = 0

  server.use(
    http.get(apiUrl("/services"), () => {
      childRequests++

      return HttpResponse.json({ items: [] })
    })
  )

  function Child() {
    const query = useQuery({ queryKey: ["services"], queryFn: () => dataOf(api.GET("/services")) })

    return <p>{query.isSuccess ? "Services loaded" : "Loading services"}</p>
  }

  renderWithProviders(
    <SessionProvider>
      <RequireStaff>
        <Child />
      </RequireStaff>
    </SessionProvider>
  )

  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(childRequests).toBe(0)
  expect(screen.queryByText(/services/i)).toBeNull()
  release()
  expect(await screen.findByText("Services loaded")).toBeInTheDocument()
  expect(childRequests).toBe(1)
})

test("the staff layout's server render is only the splash", () => {
  const { wrapper: Providers } = testProviders()

  const html = renderToString(
    <Providers>
      <SessionProvider>
        <RequireStaff>
          <p>Guarded page</p>
        </RequireStaff>
      </SessionProvider>
    </Providers>
  )

  expect(html).toContain('aria-busy="true"')
  expect(html).not.toContain("Guarded page")
})
