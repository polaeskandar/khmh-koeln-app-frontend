"use client"

import { cn } from "@/lib/utils"
import { Clock, MapPin } from "lucide-react"

import { useFormat } from "@/i18n/format"
import type { SessionView } from "./api"

export function SessionWhen({
  item,
  className,
}: {
  item: Pick<SessionView, "startTime" | "endTime" | "location">
  className?: string
}) {
  const f = useFormat()

  return (
    <span
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground",
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5 tabular-nums">
        <Clock className="size-3.5" aria-hidden="true" />
        {f.timeRange(item.startTime, item.endTime)}
      </span>
      {item.location ? (
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span dir="auto" className="truncate">
            {item.location}
          </span>
        </span>
      ) : null}
    </span>
  )
}
