import { setRequestLocale } from "next-intl/server"

import { DEFAULT_LOCALE, isLocale, type Locale } from "./config"

export async function pageLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params
  const checked = isLocale(locale) ? locale : DEFAULT_LOCALE
  setRequestLocale(checked)

  return checked
}
