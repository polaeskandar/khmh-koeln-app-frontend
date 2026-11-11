import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, expect, test } from "vitest"

import type { Me } from "@/features/identity/auth/api"
import { SessionProvider } from "@/features/identity/auth/session"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { nevineGroups } from "@test/support/fixtures/member"
import { server } from "@test/support/msw"
import { navigation, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"
import MemberLayout from "@/app/[locale]/member/layout"
import { MemberAccountPage } from "@/features/portals/member/member-account-page"

const nevine: Me = {
  ...me.noRoles,
  account: { ...me.noRoles.account, displayName: "Nevine Boulos", email: "nevine@example.org" },
  member: { personId: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ee001", groupCount: 2 },
}

beforeEach(() => {
  navigation.pathname = "/member/account/"
})

function open(
  groups: typeof nevineGroups | (() => Response) = nevineGroups,
  locale: Locale = "en"
) {
  server.use(
    http.get(apiUrl("/me"), () =>
      HttpResponse.json({ ...nevine, account: { ...nevine.account, language: locale } })
    ),
    http.get(apiUrl("/me/erasure-request"), () => HttpResponse.json({ erasureRequested: null })),
    http.get(apiUrl("/member/groups"), () =>
      typeof groups === "function"
        ? groups()
        : HttpResponse.json({ today: "2026-11-08", items: groups })
    )
  )

  renderWithProviders(
    <SessionProvider>
      <MemberLayout>
        <MemberAccountPage />
      </MemberLayout>
    </SessionProvider>,
    { locale }
  )
}

test("lists the groups in the locale's list format", async () => {
  open()

  expect(
    await screen.findByText("Bible Study and Level 1 (Coptic Language Course)")
  ).toBeInTheDocument()

  expect(screen.getByText("nevine@example.org")).toHaveAttribute("dir", "ltr")
  expect(screen.getByText("What the church sees")).toBeInTheDocument()
})

test("a member without groups reads so", async () => {
  open([])
  expect(await screen.findByText("Not in a group at the moment")).toBeInTheDocument()
})

test("an unlinked account reads so", async () => {
  open(() => problem(403, "forbidden"))
  expect(await screen.findByText("Not linked to your record yet")).toBeInTheDocument()
})

test("Deutsch switches the language in place", async () => {
  server.use(
    http.put(apiUrl("/me/language"), () =>
      HttpResponse.json({ ...nevine, account: { ...nevine.account, language: "de" } })
    )
  )

  open()
  expect(await screen.findByRole("radio", { name: "English" })).toBeChecked()
  await userEvent.click(screen.getByRole("radio", { name: "Deutsch" }))
  expect(router.replace).toHaveBeenCalledWith("/member/account/", { locale: "de" })
})

test("a wrong current password shows under the field", async () => {
  server.use(
    http.post(apiUrl("/me/password"), () =>
      problem(422, "validation.failed", {
        fieldErrors: { currentPassword: { code: "accounts.currentPasswordWrong", params: {} } },
      })
    )
  )

  open()
  await userEvent.click(await screen.findByRole("button", { name: "Change password…" }))
  const dialog = within(await screen.findByRole("dialog"))
  await userEvent.type(dialog.getByLabelText("Current password"), "wrong-password")
  await userEvent.type(dialog.getByLabelText("New password"), "new-password-12")
  await userEvent.click(dialog.getByRole("button", { name: "Change password" }))
  expect(await dialog.findByText("This is not your current password.")).toBeInTheDocument()
})

test("in Arabic the email stays left to right and the tab bar marks Account", async () => {
  open(nevineGroups, "ar")
  expect(await screen.findByText("nevine@example.org")).toHaveAttribute("dir", "ltr")
  const navs = await screen.findAllByRole("navigation")
  const current = navs.flatMap((nav) => [...nav.querySelectorAll("[aria-current=page]")])
  expect(current).toHaveLength(2)

  for (const link of current) {
    expect(link).toHaveAttribute("href", "/member/account/")
  }
})

test("the member can download their data and ask to delete it, record included", async () => {
  open()
  expect(await screen.findByRole("button", { name: "Download (JSON)" })).toBeInTheDocument()
  await userEvent.click(await screen.findByRole("button", { name: "Delete account…" }))

  expect(
    within(await screen.findByRole("alertdialog")).getByText(
      "Your own member record, with your attendance marks and homework reports"
    )
  ).toBeInTheDocument()

  expect(screen.queryByText(/children’s data/)).toBeNull()
})
