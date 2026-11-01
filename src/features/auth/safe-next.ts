import { LOCALES } from "@/i18n/config"

const BASE = "https://app.invalid"

export function safeNext(next: string | null | undefined): string | null {
  if (!next || next.includes("\\") || /[\u0000-\u001f]/.test(next)) {
    return null
  }

  if (!LOCALES.some((locale) => next.startsWith(`/${locale}/`))) {
    return null
  }

  try {
    const url = new URL(next, BASE)

    return url.origin === BASE ? `${url.pathname}${url.search}${url.hash}` : null
  } catch {
    return null
  }
}
