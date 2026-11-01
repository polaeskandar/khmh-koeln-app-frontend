"use client"

import type { Locale } from "./config"
import { storeLocale } from "./locale-choice"
import { usePathname, useRouter } from "./navigation"

export function useSwitchLocale() {
  const router = useRouter()
  const pathname = usePathname()

  return (locale: Locale) => {
    storeLocale(locale)
    router.replace(`${pathname}${window.location.search}`, { locale })
  }
}
