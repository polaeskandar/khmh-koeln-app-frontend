"use client"

import { type ReactNode, useEffect, useState } from "react"

const enabled =
  process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_API_MOCKING === "enabled"

export function ApiMocking({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!enabled)

  useEffect(() => {
    if (import.meta.env.SSR || !enabled) {
      return
    }

    import("./browser")
      .then(({ worker }) => worker.start({ onUnhandledFrame: "bypass" }))
      .then(() => setReady(true))
  }, [])

  return ready ? children : null
}
