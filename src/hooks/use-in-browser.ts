"use client"

import { useSyncExternalStore } from "react"

const subscribeToNothing = () => () => {}

export function useInBrowser() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  )
}
