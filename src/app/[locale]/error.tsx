"use client"

import { QueryErrorState } from "@/components/page-states"

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60svh] items-center justify-center p-6">
      <QueryErrorState error={error} onRetry={reset} />
    </div>
  )
}
