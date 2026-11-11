"use client"

import { useQueryClient } from "@tanstack/react-query"

import type { Locale } from "@/i18n/config"
import { storeLocale } from "@/i18n/locale-choice"
import { usePathname, useRouter } from "@/i18n/navigation"

import { saveAccountLanguage } from "./account-language"

let carriedFragment: string | null = null

export function carryFragment(fragment: string | null) {
  carriedFragment = fragment
}

export function useSwitchLocale() {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  return (locale: Locale) => {
    storeLocale(locale)
    router.replace(`${pathname}${window.location.search}${carriedFragment ?? ""}`, { locale })
    saveAccountLanguage(queryClient, locale)
  }
}
