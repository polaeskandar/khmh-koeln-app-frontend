import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { afterEach, describe, expect, test, vi } from "vitest"

import { SessionProvider } from "@/features/auth/session"
import { LOCALES } from "@/i18n/config"
import { PRIVACY_NOTICE_VERSION, parsePrivacyNotice } from "@/lib/privacy"
import { apiUrl } from "@test/support/api"
import { me } from "@test/support/fixtures/me"
import { server } from "@test/support/msw"
import { router } from "@test/support/navigation"
import { renderWithProviders } from "@test/support/providers"

import { readPrivacyNotice } from "@/features/privacy/notice"
import { PrivacyNoticePage } from "@/features/privacy/privacy-notice-page"

vi.mock("@/i18n/navigation", async () => (await import("@test/support/navigation")).navigationMock)

afterEach(() => {
  vi.unstubAllEnvs()
  router.back.mockReset()
  router.replace.mockReset()
})

const notice = (status: string, body = "## Who is responsible\n\nThe church office.") =>
  `---\nversion: ${PRIVACY_NOTICE_VERSION}\nstatus: ${status}\n---\n\n${body}\n`

describe("the notice files", () => {
  test.each(LOCALES)("%s has the version the app sends", (locale) => {
    expect(readPrivacyNotice(locale).version).toBe(PRIVACY_NOTICE_VERSION)
  })

  test("rights go through the church office, with no Your data in the app", () => {
    const text = JSON.stringify(readPrivacyNotice("en").blocks)
    expect(text).toContain("To use these rights, ask the church office")
    expect(text).toContain("Administrators in the church office see all data")
    expect(text).not.toContain("Your data")
  })
})

describe("parsePrivacyNotice", () => {
  test("reads headings, lists and paragraphs", () => {
    expect(
      parsePrivacyNotice(notice("draft", "## Why\n\n- One\n- Two\n  lines\n\nText.")).blocks
    ).toEqual([
      { kind: "heading", text: "Why" },
      { kind: "list", items: ["One", "Two lines"] },
      { kind: "paragraph", text: "Text." },
    ])
  })

  test("a final notice can't keep a bracketed placeholder", () => {
    expect(() => parsePrivacyNotice(notice("final", "Ask [the church office]."))).toThrow(
      /placeholder \[the church office\]/
    )

    expect(parsePrivacyNotice(notice("draft", "Ask [the church office].")).status).toBe("draft")
    expect(parsePrivacyNotice(notice("final")).status).toBe("final")
  })

  test("rejects another version or status", () => {
    expect(() =>
      parsePrivacyNotice(notice("draft").replace(PRIVACY_NOTICE_VERSION, "2025-01"))
    ).toThrow(/version 2025-01/)

    expect(() => parsePrivacyNotice(notice("published"))).toThrow(/draft or final/)
  })
})

describe("the page", () => {
  test("shows the title, the version and the draft banner", () => {
    renderWithProviders(<PrivacyNoticePage notice={readPrivacyNotice("en")} />)
    expect(screen.getByRole("heading", { level: 1, name: "Privacy notice" })).toBeInTheDocument()
    expect(screen.getByText("Version 2026-11")).toBeInTheDocument()
    expect(screen.getByRole("note")).toHaveTextContent(/^Draft\./)
    expect(screen.getByRole("heading", { level: 2, name: "Your rights" })).toBeInTheDocument()
  })

  test("a final notice has no banner", () => {
    renderWithProviders(<PrivacyNoticePage notice={parsePrivacyNotice(notice("final"))} />)
    expect(screen.queryByRole("note")).not.toBeInTheDocument()
  })

  test("reads in Arabic", () => {
    renderWithProviders(<PrivacyNoticePage notice={readPrivacyNotice("ar")} />, { locale: "ar" })
    expect(screen.getByRole("heading", { level: 1, name: "إشعار الخصوصية" })).toBeInTheDocument()
    expect(screen.getByText("الإصدار 2026-11")).toBeInTheDocument()
  })

  test("goes back to the previous page, else links to sign-in", async () => {
    renderWithProviders(<PrivacyNoticePage notice={readPrivacyNotice("en")} />)
    const back = screen.getByRole("link", { name: "Back" })
    expect(back).toHaveAttribute("href", "/sign-in/")
    window.history.pushState(null, "", "/en/privacy/")
    await userEvent.click(back)
    expect(router.back).toHaveBeenCalledOnce()
  })

  test("the footer links to the notice and the configured legal notice", () => {
    vi.stubEnv("NEXT_PUBLIC_IMPRESSUM_URL", "https://example.org/impressum")
    renderWithProviders(<PrivacyNoticePage notice={readPrivacyNotice("en")} />)
    const footer = screen.getByRole("contentinfo")
    expect(footer.querySelector('a[href="/privacy/"]')).toHaveTextContent("Privacy notice")

    expect(screen.getByRole("link", { name: "Legal notice" })).toHaveAttribute(
      "href",
      "https://example.org/impressum"
    )
  })

  test("a signed-in visitor stays on the notice", async () => {
    let asked = false

    server.use(
      http.get(apiUrl("/me"), () => {
        asked = true

        return HttpResponse.json(me.administrator)
      })
    )

    renderWithProviders(
      <SessionProvider>
        <PrivacyNoticePage notice={readPrivacyNotice("en")} />
      </SessionProvider>
    )

    await waitFor(() => expect(asked).toBe(true))
    expect(screen.getByRole("heading", { level: 1, name: "Privacy notice" })).toBeInTheDocument()
    expect(router.replace).not.toHaveBeenCalled()
  })
})
