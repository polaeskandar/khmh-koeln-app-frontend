import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, describe, expect, test } from "vitest"

import { NavUser } from "@/features/portals/staff/staff-account-menu"
import type { Me } from "@/features/identity/auth/api"
import { RedirectIfSignedIn } from "@/features/identity/auth/guards"
import { SessionProvider } from "@/features/identity/auth/session"
import { ParentAccountMenu } from "@/features/portals/parent/parent-account-menu"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { navigation, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import MemberLayout from "@/app/[locale]/member/layout"

afterEach(() => {
  window.history.replaceState(null, "", "/")
})

const linked = (account: Me, groupCount: number): Me => ({
  ...account,
  member: { personId: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ee001", groupCount },
})

const nevine = linked(
  {
    ...me.noRoles,
    account: { ...me.noRoles.account, displayName: "Nevine Boulos", email: "nevine@example.org" },
  },
  2
)

const hoda = linked(
  { ...me.parent, account: { ...me.parent.account, displayName: "Hoda Farag" } },
  2
)

const answerMe = (account: Me | null) =>
  server.use(
    http.get(apiUrl("/me"), () =>
      account ? HttpResponse.json(account) : problem(401, "auth.unauthenticated")
    )
  )

describe("the member layout", () => {
  test.each([
    ["a member only", nevine],
    ["a parent and member", hoda],
    ["staff with no current group", linked(me.servant, 0)],
    ["staff in one group", linked(me.servant, 1)],
  ])("lets in %s", async (_, account) => {
    answerMe(account)

    renderWithProviders(
      <SessionProvider>
        <MemberLayout>
          <p>Member page</p>
        </MemberLayout>
      </SessionProvider>
    )

    expect(await screen.findByText("Member page")).toBeInTheDocument()
    expect(screen.getByText("For members")).toBeInTheDocument()
  })

  test.each([
    ["an unlinked parent", me.parent, "/parent/"],
    ["unlinked staff", me.servant, "/"],
  ])("sends %s to their own start", async (_, account, to) => {
    answerMe(account)

    renderWithProviders(
      <SessionProvider>
        <MemberLayout>
          <p>Member page</p>
        </MemberLayout>
      </SessionProvider>
    )

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(to))
    expect(screen.queryByText("Member page")).not.toBeInTheDocument()
  })

  test("an account with neither roles nor a record sees No role yet", async () => {
    answerMe(me.noRoles)

    renderWithProviders(
      <SessionProvider>
        <MemberLayout>
          <p>Member page</p>
        </MemberLayout>
      </SessionProvider>
    )

    expect(await screen.findByRole("button", { name: "Sign out" })).toBeInTheDocument()
    expect(screen.queryByText("Member page")).not.toBeInTheDocument()
  })

  test("signed out goes to sign-in and back", async () => {
    window.history.replaceState(null, "", "/en/member/")
    answerMe(null)

    renderWithProviders(
      <SessionProvider>
        <MemberLayout>
          <p>Member page</p>
        </MemberLayout>
      </SessionProvider>
    )

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/sign-in/?next=%2Fen%2Fmember%2F")
    )
  })
})

describe("after sign-in", () => {
  test.each([
    ["Nevine", nevine, "/member/"],
    ["Hoda", hoda, "/parent/"],
    ["Daniel", me.servant, "/"],
  ])("%s lands on %s", async (_, account, to) => {
    answerMe(account)

    renderWithProviders(
      <SessionProvider>
        <RedirectIfSignedIn>
          <p>Sign-in form</p>
        </RedirectIfSignedIn>
      </SessionProvider>
    )

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(to))
  })
})

describe("My groups", () => {
  test("shows in the parent menu for Hoda", async () => {
    answerMe(hoda)

    renderWithProviders(
      <SessionProvider>
        <ParentAccountMenu />
      </SessionProvider>
    )

    await userEvent.click(await screen.findByRole("button", { name: /Hoda Farag/ }))

    expect(await screen.findByRole("menuitem", { name: "My groups" })).toHaveAttribute(
      "href",
      "/member/"
    )
  })

  test.each([
    [0, false],
    [1, true],
  ])("in the staff menu with %s groups: %s", async (groupCount, shown) => {
    answerMe(linked(me.servant, groupCount))

    renderWithProviders(
      <SessionProvider>
        <NavUser />
      </SessionProvider>,
      { sidebar: true }
    )

    await userEvent.click(await screen.findByRole("button", { name: "Account menu" }))
    const menu = within(await screen.findByRole("menu"))
    expect(menu.queryByRole("menuitem", { name: "My groups" }) !== null).toBe(shown)
  })

  test("the member menu opens the parent portal for a parent", async () => {
    navigation.pathname = "/member/"
    answerMe(hoda)

    renderWithProviders(
      <SessionProvider>
        <MemberLayout>
          <p>Member page</p>
        </MemberLayout>
      </SessionProvider>
    )

    await userEvent.click(await screen.findByRole("button", { name: "Account of Hoda Farag" }))
    const menu = within(await screen.findByRole("menu"))

    expect(menu.getByRole("menuitem", { name: "Open the parent portal" })).toHaveAttribute(
      "href",
      "/parent/"
    )

    expect(menu.queryByRole("menuitem", { name: "Open the staff app" })).not.toBeInTheDocument()
  })
})

describe("the member navigation", () => {
  test("both navigations are labelled Member portal", async () => {
    navigation.pathname = "/member/homework/view/"
    answerMe(nevine)

    renderWithProviders(
      <SessionProvider>
        <MemberLayout>
          <p>Member page</p>
        </MemberLayout>
      </SessionProvider>
    )

    const navs = await screen.findAllByRole("navigation", { name: "Member portal" })
    expect(navs).toHaveLength(2)

    for (const nav of navs) {
      expect(within(nav).getByRole("link", { name: "Homework" })).toHaveAttribute(
        "aria-current",
        "page"
      )
    }
  })
})
