import type { Messages } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { DEFAULT_LOCALE, isLocale, type Locale } from "./config"

export async function pageLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params
  const checked = isLocale(locale) ? locale : DEFAULT_LOCALE
  setRequestLocale(checked)

  return checked
}

export async function pageTitle(
  params: Promise<{ locale: string }>,
  page: keyof Messages["pages"]
): Promise<string> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "pages" })

  return t(page)
}
