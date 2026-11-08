"use client"

import { useQueryClient } from "@tanstack/react-query"

import { saveAccountLanguage } from "@/features/identity/account-language"

import type { Locale } from "./config"
import { storeLocale } from "./locale-choice"
import { usePathname, useRouter } from "./navigation"

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
