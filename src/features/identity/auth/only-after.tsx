"use client"

import type { ReactNode } from "react"

import { NotFoundPage } from "@/components/not-found-page"
import { useInBrowser } from "@/hooks/use-in-browser"

import { type AuthOutcome, lastOutcome } from "./auth-outcome"

export function OnlyAfter({ outcome, children }: { outcome: AuthOutcome; children: ReactNode }) {
  const inBrowser = useInBrowser()

  if (!inBrowser) {
    return null
  }

  return lastOutcome() === outcome ? children : <NotFoundPage />
}
