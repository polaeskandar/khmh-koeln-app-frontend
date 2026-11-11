"use client"

import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { useId } from "react"

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
  const labelId = useId()
  const percent = assigned > 0 ? Math.round((completed / assigned) * 100) : 0

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span id={labelId} className="text-sm tabular-nums">
        {t.rich("completion", {
          completed,
          assigned,
          strong: (chunks) => <span className="font-medium">{chunks}</span>,
        })}
      </span>
      <span
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuenow={percent}
        className="h-1 w-full bg-muted"
      >
        <span className="block h-full bg-primary" style={{ width: `${percent}%` }} />
      </span>
    </div>
  )
}
