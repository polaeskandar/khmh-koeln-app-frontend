"use client"

import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export function CompletionMeter({
  completed,
  assigned,
  className,
}: {
  completed: number
  assigned: number
  className?: string
}) {
  const t = useTranslations("lessons")
  const ratio = assigned > 0 ? completed / assigned : 0

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-sm tabular-nums">
        {t.rich("completion", {
          completed,
          assigned,
          strong: (chunks) => <span className="font-medium">{chunks}</span>,
        })}
      </span>
      <span className="h-1 w-full bg-muted" aria-hidden="true">
        <span
          className="block h-full bg-primary"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </span>
    </div>
  )
}
