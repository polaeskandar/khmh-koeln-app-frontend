import type { QueryClient } from "@tanstack/react-query"

import type { Locale } from "@/i18n/config"

import { meQuery, saveLanguageRequest } from "./api"

export const LANGUAGE_APPLIED_KEY = ["session", "language-applied"] as const

type FailureListener = (language: Locale, error: unknown) => boolean

const listeners = new Set<FailureListener>()
let unheard: { language: Locale; error: unknown } | null = null

function failed(language: Locale, error: unknown) {
  if (![...listeners].some((listener) => listener(language, error))) {
    unheard = { language, error }
  }
}

const accountOf = (queryClient: QueryClient) =>
  queryClient.getQueryData(meQuery.queryKey)?.account.id

export function saveAccountLanguage(queryClient: QueryClient, language: Locale) {
  const account = accountOf(queryClient)

  if (!account) {
    return
  }

  saveLanguageRequest(language).then(
    (me) => {
      if (accountOf(queryClient) === account) {
        queryClient.setQueryData(meQuery.queryKey, me)
      }
    },
    (error: unknown) => failed(language, error)
  )
}

export function markLanguageApplied(queryClient: QueryClient, account: string) {
  queryClient.setQueryDefaults(LANGUAGE_APPLIED_KEY, { gcTime: Infinity })
  queryClient.setQueryData(LANGUAGE_APPLIED_KEY, account)
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
