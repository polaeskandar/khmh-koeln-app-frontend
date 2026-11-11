import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, describe, expect, test } from "vitest"

import { LanguageMenu } from "@/components/language-switch"
import { useSwitchLocale } from "@/features/identity/auth/use-switch-locale"
import type { Locale } from "@/i18n/config"
import type { Schemas } from "@/lib/api/client"
import { apiUrl, problem } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { navigation, router } from "@test/support/navigation"
import { makeTestQueryClient, renderWithProviders } from "@test/support/providers"
import { expectOnlyToast } from "@test/support/toasts"
import { LANGUAGE_APPLIED_KEY } from "@/features/identity/auth/account-language"
import type { Me } from "@/features/identity/auth/api"
import { RequireStaff } from "@/features/identity/auth/guards"
import { SessionProvider } from "@/features/identity/auth/session"

afterEach(() => {
  localStorage.clear()
  window.history.replaceState(null, "", "/")
})

function backend(
  account: () => Me | null,
  save: (language: string) => Response | Promise<Response>
) {
  const calls = { me: 0, saves: [] as unknown[] }

  server.use(
    http.get(apiUrl("/me"), () => {
      calls.me++
      const current = account()

      return current ? HttpResponse.json(current) : problem(401, "auth.unauthenticated")
    }),
    http.put(apiUrl("/me/language"), async ({ request }) => {
      const body = (await request.json()) as Schemas["ChangeLanguageRequest"]
      calls.saves.push(body)

      return save(body.language ?? "")
    })
  )

  return calls
}

function SwitchingMenu() {
  const switchLocale = useSwitchLocale()

  return <LanguageMenu onSwitch={switchLocale} />
}

function menu(client = makeTestQueryClient(), locale: Locale = "en") {
  return renderWithProviders(
    <SessionProvider>
      <SwitchingMenu />
    </SessionProvider>,
    { client, locale }
  )
}

async function chooseGerman() {
  await userEvent.click(screen.getByRole("button", { name: "Language" }))
  await userEvent.click(screen.getByRole("menuitemradio", { name: "Deutsch" }))
}

describe("choosing a language while signed in", () => {
  test("switches at once and saves it with exactly one PUT", async () => {
    let answer: () => void = () => {}

    const calls = backend(
      () => me.servant,
      (language) =>
        new Promise(
          (resolve) =>
            (answer = () =>
              resolve(
                HttpResponse.json({ ...me.servant, account: { ...me.servant.account, language } })
              ))
        )
    )

    const client = makeTestQueryClient()
    menu(client)
    await waitFor(() => expect(client.getQueryData(["me"])).toBeDefined())
    await chooseGerman()
    expect(router.replace).toHaveBeenCalledExactlyOnceWith("/", { locale: "de" })
    await waitFor(() => expect(calls.saves).toEqual([{ language: "de" }]))
    answer()
    await waitFor(() => expect(client.getQueryData<Me>(["me"])?.account.language).toBe("de"))
    expect(calls.me).toBe(1)
  })

  test("a save that answers after the session ended keeps the account out of the cache", async () => {
    let answer: () => void = () => {}

    backend(
      () => me.servant,
      () => new Promise((resolve) => (answer = () => resolve(HttpResponse.json(me.servant))))
    )

    const client = makeTestQueryClient()
    menu(client)
    await waitFor(() => expect(client.getQueryData(["me"])).toBeDefined())
    await chooseGerman()
    client.clear()
    answer()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(client.getQueryData(["me"])).toBeUndefined()
  })

  test("signed out, nothing is saved", async () => {
    const calls = backend(
      () => null,
      () => HttpResponse.json({})
    )

    const client = makeTestQueryClient()
    menu(client)
    await waitFor(() => expect(client.getQueryState(["me"])?.status).toBe("error"))
    await chooseGerman()
    expect(router.replace).toHaveBeenCalledOnce()
    expect(calls.saves).toEqual([])
  })

  test.each([
    [
      "a 500",
      () => problem(500, "internal"),
      "Bei uns ist etwas schiefgelaufen. Versuchen Sie es später noch einmal.",
    ],
    [
      "no connection",
      () => HttpResponse.error(),
      "Keine Verbindung. Prüfen Sie Ihre Internetverbindung und versuchen Sie es noch einmal.",
    ],
  ])("after %s, one toast in the new language; the language stays", async (_, failure, text) => {
    backend(() => me.servant, failure)
    const client = makeTestQueryClient()
    const english = menu(client)
    await waitFor(() => expect(client.getQueryData(["me"])).toBeDefined())
    await chooseGerman()
    english.unmount()
    menu(client, "de")
    await expectOnlyToast(text)
    expect(localStorage.getItem("khmk.locale")).toBe("de")
  })
})

function guardedPage(client = makeTestQueryClient(), locale: Locale = "en") {
  return renderWithProviders(
    <SessionProvider>
      <RequireStaff>
        <p>Service page</p>
      </RequireStaff>
    </SessionProvider>,
    { client, locale }
  )
}

describe("the account's language after sign-in or app start", () => {
  test("an Arabic account landing on /en/ opens the same page in Arabic, once, without saving", async () => {
    window.history.replaceState(null, "", "/en/services/view/?id=X")
    navigation.pathname = "/services/view/"

    const calls = backend(
      () => ({ ...me.servant, account: { ...me.servant.account, language: "ar" } }),
      () => HttpResponse.json({})
    )

    guardedPage()

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledExactlyOnceWith("/services/view/?id=X", {
        locale: "ar",
      })
    )

    expect(screen.queryByText("Service page")).toBeNull()
    expect(localStorage.getItem("khmk.locale")).toBe("ar")
    expect(calls.saves).toEqual([])
  })

  test.each(["en"] as const)("language %s doesn't navigate", async (language) => {
    backend(
      () => ({ ...me.servant, account: { ...me.servant.account, language } }),
      () => HttpResponse.json({})
    )

    guardedPage()
    expect(await screen.findByText("Service page")).toBeInTheDocument()
    expect(router.replace).not.toHaveBeenCalled()
  })

  test("only once per session; signing out starts over", async () => {
    let account: Me = { ...me.servant, account: { ...me.servant.account, language: "en" } }

    backend(
      () => account,
      () => HttpResponse.json({})
    )

    const client = makeTestQueryClient()
    const german = guardedPage(client, "de")

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledExactlyOnceWith("/", { locale: "en" })
    )

    german.unmount()
    router.replace.mockReset()
    account = { ...me.servant, account: { ...me.servant.account, language: "de" } }
    const english = guardedPage(client, "en")
    expect(await screen.findByText("Service page")).toBeInTheDocument()
    await client.refetchQueries({ queryKey: ["me"] })
    expect(router.replace).not.toHaveBeenCalled()
    english.unmount()
    client.clear()
    account = { ...me.servant, account: { ...me.servant.account, language: "ar" } }
    guardedPage(client, "en")

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledExactlyOnceWith("/", { locale: "ar" })
    )
  })

  test("the applied marker is kept for the whole session, not garbage-collected", async () => {
    backend(
      () => me.servant,
      () => HttpResponse.json({})
    )

    const client = makeTestQueryClient()
    guardedPage(client, "en")
    expect(await screen.findByText("Service page")).toBeInTheDocument()

    await waitFor(() =>
      expect(client.getQueryCache().find({ queryKey: LANGUAGE_APPLIED_KEY })?.options.gcTime).toBe(
        Infinity
      )
    )
  })
})
