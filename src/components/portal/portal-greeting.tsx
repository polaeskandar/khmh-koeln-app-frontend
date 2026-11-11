"use client"

import { useGreeting } from "@/hooks/use-greeting"
import { useFormat } from "@/i18n/format"
import type { LocalDate } from "@/lib/api/types/common"

export function PortalGreeting({ name, today }: { name: string; today: LocalDate }) {
  const f = useFormat()
  const greeting = useGreeting(name)

  return (
    <header className="flex flex-col gap-1">
      <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">{greeting}</h1>
      <p className="text-sm text-muted-foreground">
        {f.longDate(today)} · {f.copticDate(today)}
      </p>
    </header>
  )
}
