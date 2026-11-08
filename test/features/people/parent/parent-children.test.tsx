import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { SessionProvider } from "@/features/identity/session"
import type { Locale } from "@/i18n/config"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { MIMI_ID, MINA_ID, mimi, mina } from "@test/support/fixtures/parent"
import { server } from "@test/support/msw"
import { navigation, router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import type { ChildSummary } from "@/features/people/parent/api"
import { ParentAccount } from "@/features/people/parent/parent-account"
import { ParentChildren } from "@/features/people/parent/parent-children"
import { ParentShell } from "@/features/people/parent/parent-shell"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

beforeEach(() => {
  router.replace.mockClear()
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
})

afterEach(() => vi.restoreAllMocks())

const mariam = { ...mimi, fullName: "Mariam Hanna", name: "Mariam" }
const minaHanna = { ...mina, fullName: "Mina Hanna", toDo: 1, done: 2 }

function serve(items: ChildSummary[]) {
  server.use(
    http.get(apiUrl("/me"), () => HttpResponse.json(me.parent)),
    http.get(apiUrl("/parent/children"), () => HttpResponse.json({ today: "2026-11-08", items }))
  )
}

describe("My children", () => {
  function open(items: ChildSummary[], locale: Locale = "en") {
    serve(items)
    renderWithProviders(<ParentChildren />, { locale })
  }

  test("without children it says none is linked", async () => {
    open([])
    expect(await screen.findByText("No child is linked to your account yet.")).toBeInTheDocument()
  })

  test("one child: class, service and counts, linking to the homework", async () => {
    open([minaHanna])
    const card = await screen.findByRole("link", { name: /Mina Hanna/ })
    expect(card).toHaveAttribute("href", `/parent/homework/?child=${MINA_ID}`)
    expect(card).toHaveTextContent("3rd Class · Sunday School")
    expect(card).toHaveTextContent("1 to do · 2 done")
  })

  test("two children, one without a class and nothing to do", async () => {
    open([{ ...mariam, stage: null, service: null, toDo: 0, done: 1 }, minaHanna])
    const cards = await screen.findAllByRole("link")
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveAttribute("href", `/parent/homework/?child=${MIMI_ID}`)
    expect(cards[0]).toHaveTextContent("Not in a class at the moment")
    expect(cards[0]).toHaveTextContent("Nothing to do · 1 done")
  })

  test("in German", async () => {
    open(
      [
        { ...minaHanna, toDo: 2 },
        { ...mariam, stage: null, toDo: 0 },
      ],
      "de"
    )

    const cards = await screen.findAllByRole("link")
    expect(cards[0]).toHaveTextContent("2 offen · 2 erledigt")
    expect(cards[1]).toHaveTextContent("Zurzeit in keiner Klasse")
    expect(cards[1]).toHaveTextContent("Nichts zu erledigen")
  })

  test("in Arabic", async () => {
    open([minaHanna], "ar")
    const card = await screen.findByRole("link", { name: /Mina Hanna/ })
    expect(card).toHaveTextContent(/المطلوب: .+ · المنجز: /)
  })
})

describe("Account", () => {
  function open(items: ChildSummary[], locale: Locale = "en") {
    navigation.pathname = "/parent/account/"
    serve(items)

    renderWithProviders(
      <SessionProvider>
        <ParentAccount />
      </SessionProvider>,
      { locale }
    )
  }

  test("lists the details and the children's full names", async () => {
    open([mariam, minaHanna])
    expect(await screen.findByText("Mariam Hanna, Mina Hanna")).toBeInTheDocument()
    expect(screen.getByText(me.parent.account.email)).toHaveAttribute("dir", "ltr")
    expect(screen.getByText("What the church sees")).toBeInTheDocument()
  })

  test("joins the names the Arabic way", async () => {
    open([mariam, minaHanna], "ar")
    expect(await screen.findByText("Mariam Hanna، Mina Hanna")).toBeInTheDocument()
  })

  test("says none is linked without children", async () => {
    open([])
    expect(await screen.findByText("None linked yet")).toBeInTheDocument()
  })

  test("children that fail to load say so with a retry", async () => {
    open([mariam])
    server.use(http.get(apiUrl("/parent/children"), () => problem(403, "forbidden")))
    expect(await screen.findByText("This couldn’t be loaded.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
  })

  test("Deutsch switches the language in place", async () => {
    open([mina])
    expect(await screen.findByRole("radio", { name: "English" })).toBeChecked()
    await userEvent.click(screen.getByRole("radio", { name: "Deutsch" }))
    expect(router.replace).toHaveBeenCalledWith("/parent/account/", { locale: "de" })
  })

  test("the password change shows a wrong current password, then closes after 204", async () => {
    let attempts = 0

    server.use(
      http.post(apiUrl("/me/password"), () =>
        ++attempts === 1
          ? problem(422, "validation.failed", {
              fieldErrors: {
                currentPassword: { code: "accounts.currentPasswordWrong", params: {} },
              },
            })
          : new HttpResponse(null, { status: 204 })
      )
    )

    open([mina])
    await userEvent.click(await screen.findByRole("button", { name: "Change password…" }))
    const dialog = within(await screen.findByRole("dialog"))
    await userEvent.type(dialog.getByLabelText("Current password"), "wrong-password")
    await userEvent.type(dialog.getByLabelText("New password"), "new-password-12")
    await userEvent.click(dialog.getByRole("button", { name: "Change password" }))
    expect(await dialog.findByText("This is not your current password.")).toBeInTheDocument()
    await userEvent.click(dialog.getByRole("button", { name: "Change password" }))
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("Your password is changed."))
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByText("Mina Farag")).toBeInTheDocument()
  })
})

test("the tab bar shows Home, My children, Homework and Account", async () => {
  navigation.pathname = "/parent/children/"
  serve([])

  renderWithProviders(
    <SessionProvider>
      <ParentShell>
        <p>Page</p>
      </ParentShell>
    </SessionProvider>
  )

  const navs = await screen.findAllByRole("navigation", { name: "Parent portal" })

  for (const nav of navs) {
    const links = within(nav).getAllByRole("link")
    expect(links.map((l) => l.textContent)).toEqual(["Home", "My children", "Homework", "Account"])

    expect(within(nav).getByRole("link", { name: "My children" })).toHaveAttribute(
      "aria-current",
      "page"
    )
  }
})
