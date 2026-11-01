"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"

import { ApiError } from "./problem"

export function shouldRetry(failureCount: number, error: unknown) {
  return (
    failureCount < 2 && error instanceof ApiError && (error.status === 0 || error.status >= 500)
  )
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry },
      mutations: { retry: false },
    },
  })
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient)

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
