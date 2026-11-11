"use client"

import { useQueryClient } from "@tanstack/react-query"

import type { Locale } from "@/i18n/config"
import { storeLocale } from "@/i18n/locale-choice"
import { usePathname, useRouter } from "@/i18n/navigation"

import { saveAccountLanguage } from "./account-language"

export function useSwitchLocale(keepHash = "") {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  return (locale: Locale) => {
    storeLocale(locale)
    router.replace(`${pathname}${window.location.search}${keepHash}`, { locale })
    saveAccountLanguage(queryClient, locale)
  }
}
