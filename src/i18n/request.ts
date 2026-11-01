import { hasLocale } from "next-intl"
import { getRequestConfig } from "next-intl/server"

import { CHURCH_TIME_ZONE } from "@/lib/domain/time"

import { routing } from "./routing"

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: CHURCH_TIME_ZONE,
  }
})
