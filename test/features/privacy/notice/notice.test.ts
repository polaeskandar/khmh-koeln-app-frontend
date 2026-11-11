import { describe, expect, test } from "vitest"

import { LOCALES } from "@/i18n/config"
import { readPrivacyNotice } from "@/features/privacy/notice/notice"
import { PRIVACY_NOTICE_VERSION } from "@/features/privacy/notice/privacy-notice"

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
