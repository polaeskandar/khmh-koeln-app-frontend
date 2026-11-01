import { type QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { type Messages, NextIntlClientProvider } from "next-intl"
import { Direction } from "radix-ui"
import type { ReactElement, ReactNode } from "react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { directionOf, type Locale } from "@/i18n/config"
import { makeQueryClient } from "@/lib/api/query-provider"

import ar from "../../messages/ar.json"
import de from "../../messages/de.json"
import en from "../../messages/en.json"

const catalogs = { en, de, ar } as unknown as Record<Locale, Messages>

export function testProviders({ locale = "en" }: { locale?: Locale } = {}) {
  const client: QueryClient = makeQueryClient()
  function Providers({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={catalogs[locale]} timeZone="Europe/Berlin">
        <QueryClientProvider client={client}>
          <Direction.Provider dir={directionOf(locale)}>
            <TooltipProvider>{children}</TooltipProvider>
          </Direction.Provider>
        </QueryClientProvider>
      </NextIntlClientProvider>
    )
  }

  return { client, wrapper: Providers }
}

export function renderWithProviders(ui: ReactElement, options: { locale?: Locale } = {}) {
  const { client, wrapper } = testProviders(options)

  return { client, ...render(ui, { wrapper }) }
}
