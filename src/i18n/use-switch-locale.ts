"use client"

import { useQueryClient } from "@tanstack/react-query"

import { saveAccountLanguage } from "@/features/auth/account-language"

import type { Locale } from "./config"
import { storeLocale } from "./locale-choice"
import { usePathname, useRouter } from "./navigation"

export function useSwitchLocale() {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  return (locale: Locale) => {
    storeLocale(locale)
    router.replace(`${pathname}${window.location.search}`, { locale })
    saveAccountLanguage(queryClient, locale)
  }
}
