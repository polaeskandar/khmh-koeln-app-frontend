import { DEFAULT_LOCALE, isLocale, type Locale, negotiateLocale } from "./config"

const LOCALE_STORAGE_KEY = "khmk.locale"

export function storedLocale(): Locale | null {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY)

    return isLocale(value) ? value : null
  } catch {
    return null
  }
}

export function storeLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {}
}

export function localeToOpen(
  pathname: string,
  stored: Locale | null,
  deviceLanguages: readonly string[]
): Locale {
  const first = pathname.split("/")[1]

  if (isLocale(first)) {
    return first
  }

  return stored ?? negotiateLocale(deviceLanguages.join(",")) ?? DEFAULT_LOCALE
}

export function langDirBeforePaint(pathname: string, stored: string | null) {
  const locales = ["en", "de", "ar"]
  const first = pathname.split("/")[1]

  const locale =
    locales.indexOf(first) >= 0 ? first : stored && locales.indexOf(stored) >= 0 ? stored : null

  return locale ? { lang: locale, dir: locale === "ar" ? "rtl" : "ltr" } : null
}

export const prePaintScript = `(function () {
  var stored = null;
  try { stored = localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)}); } catch (e) {}
  var found = (${langDirBeforePaint.toString()})(location.pathname, stored);
  if (found) { document.documentElement.lang = found.lang; document.documentElement.dir = found.dir; }
})();`
