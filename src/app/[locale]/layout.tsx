import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { Providers } from "@/components/providers"
import { UnsupportedBrowser } from "@/components/unsupported-browser"
import { directionOf } from "@/i18n/config"
import { HtmlLangDir } from "@/i18n/html-lang-dir"
import { routing } from "@/i18n/routing"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    return {}
  }

  const t = await getTranslations({ locale, namespace: "meta" })

  return {
    title: { default: "KHMK Köln", template: "%s · KHMK Köln" },
    description: t("description"),
    robots: { index: false, follow: false },
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  return (
    <NextIntlClientProvider>
      <HtmlLangDir locale={locale} />
      <Providers dir={directionOf(locale)}>
        <UnsupportedBrowser />
        {children}
      </Providers>
    </NextIntlClientProvider>
  )
}
