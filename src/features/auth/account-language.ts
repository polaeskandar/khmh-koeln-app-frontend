import type { QueryClient } from "@tanstack/react-query"

import type { Locale } from "@/i18n/config"
import { api, dataOf } from "@/lib/api/client"

import { meQuery } from "./api"

type FailureListener = (language: Locale, error: unknown) => boolean

const listeners = new Set<FailureListener>()
let unheard: { language: Locale; error: unknown } | null = null

function failed(language: Locale, error: unknown) {
  if (![...listeners].some((listener) => listener(language, error))) {
    unheard = { language, error }
  }
}

export function saveAccountLanguage(queryClient: QueryClient, language: Locale) {
  if (!queryClient.getQueryData(meQuery.queryKey)) {
    return
  }

  dataOf(api.PATCH("/me", { body: { language } })).then(
    (me) => queryClient.setQueryData(meQuery.queryKey, me),
    (error: unknown) => failed(language, error)
  )
}

export function onLanguageSaveFailed(listener: FailureListener) {
  listeners.add(listener)

  if (unheard && listener(unheard.language, unheard.error)) {
    unheard = null
  }

  return () => {
    listeners.delete(listener)
  }
}

export const LANGUAGE_APPLIED_KEY = ["session", "languageApplied"] as const
