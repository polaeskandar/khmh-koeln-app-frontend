import { afterEach, describe, expect, test, vi } from "vitest"

import {
  langDirBeforePaint,
  localeToOpen,
  prePaintScript,
  storedLocale,
  storeLocale,
} from "@/i18n/locale-choice"

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = "en"
  document.documentElement.dir = ""
  window.history.replaceState(null, "", "/")
})

describe("the language to open", () => {
  test("the stored choice beats the device's language", () => {
    expect(localeToOpen("/", "ar", ["de-DE", "de"])).toBe("ar")
  })

  test("the device's language, else English", () => {
    expect(localeToOpen("/", null, ["de-DE", "en"])).toBe("de")
    expect(localeToOpen("/", null, ["fr-FR"])).toBe("en")
    expect(localeToOpen("/", null, [])).toBe("en")
  })

  test("a path that names a language keeps it", () => {
    expect(localeToOpen("/de/services/view/", "ar", ["en"])).toBe("de")
  })

  test("a throwing localStorage counts as no choice, so the device decides", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError")
    })

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError")
    })

    expect(() => storeLocale("ar")).not.toThrow()
    expect(localeToOpen("/", storedLocale(), ["de-DE"])).toBe("de")
  })

  test("only a known language is read back", () => {
    localStorage.setItem("khmk.locale", "fr")
    expect(storedLocale()).toBeNull()
    storeLocale("ar")
    expect(storedLocale()).toBe("ar")
  })
})

describe("before the first paint", () => {
  test("the path's language wins, else the stored one", () => {
    expect(langDirBeforePaint("/ar/services/", null)).toEqual({ lang: "ar", dir: "rtl" })
    expect(langDirBeforePaint("/", "ar")).toEqual({ lang: "ar", dir: "rtl" })
    expect(langDirBeforePaint("/de/", "ar")).toEqual({ lang: "de", dir: "ltr" })
    expect(langDirBeforePaint("/", "fr")).toBeNull()
    expect(langDirBeforePaint("/404/", null)).toBeNull()
  })

  test("the inline script sets <html lang dir>", () => {
    localStorage.setItem("khmk.locale", "ar")
    new Function(prePaintScript)()
    expect(document.documentElement.lang).toBe("ar")
    expect(document.documentElement.dir).toBe("rtl")

    window.history.replaceState(null, "", "/de/members/")
    new Function(prePaintScript)()
    expect(document.documentElement.lang).toBe("de")
    expect(document.documentElement.dir).toBe("ltr")
  })
})
