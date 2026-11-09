"use client"

import type { ReactNode } from "react"
import { useSyncExternalStore } from "react"

import { NotFoundPage } from "@/components/not-found-page"

import { type AuthOutcome, lastOutcome } from "./auth-outcome"

const subscribeNothing = () => () => {}

export function OnlyAfter({ outcome, children }: { outcome: AuthOutcome; children: ReactNode }) {
  const inBrowser = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  )

  if (!inBrowser) {
    return null
  }

  return lastOutcome() === outcome ? children : <NotFoundPage />
}
