import { LOCALES } from "@/i18n/config"

const BASE = "https://app.invalid"

const inLocale = (path: string) =>
  LOCALES.some((locale) => path.startsWith(`/${locale}/`) && path[locale.length + 2] !== "/")

export function safeNext(next: string | null | undefined): string | null {
  if (!next || next.includes("\\") || /[\u0000-\u001f]/.test(next) || !inLocale(next)) {
    return null
  }

  try {
    const url = new URL(next, BASE)

    return url.origin === BASE && inLocale(url.pathname)
      ? `${url.pathname}${url.search}${url.hash}`
      : null
  } catch {
    return null
  }
}
