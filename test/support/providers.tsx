import { QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { type Messages, NextIntlClientProvider } from "next-intl"
import type { ReactElement } from "react"

import { type Locale } from "@/i18n/config"
import { makeQueryClient } from "@/lib/api/query-provider"

import ar from "../../messages/ar.json"
import de from "../../messages/de.json"
import en from "../../messages/en.json"

const catalogs = { en, de, ar } as unknown as Record<Locale, Messages>

export function renderWithProviders(ui: ReactElement, { locale = "en" }: { locale?: Locale } = {}) {
  const client = makeQueryClient()

  return {
    client,
    ...render(
      <NextIntlClientProvider locale={locale} messages={catalogs[locale]} timeZone="Europe/Berlin">
        <QueryClientProvider client={client}>{ui}</QueryClientProvider>
      </NextIntlClientProvider>
    ),
  }
}
