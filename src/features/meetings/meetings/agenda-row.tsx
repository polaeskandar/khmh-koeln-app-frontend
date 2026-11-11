"use client"

import { cn } from "cn"
import type { ReactNode } from "react"

import { ServiceTag } from "@/components/service-tag"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import type { LocalDate } from "@/lib/api/types/common"
import type { AgendaItem } from "@/lib/api/types/meetings"

import { agendaHref } from "./agenda-links"
import { SessionBadges } from "./session-badges"
import { counted, createdOnOf, groupOf, useSessionLines } from "./session-lines"
import { SessionWhen } from "./session-when"

export function AgendaRow({
  item,
  today,
  trailing,
  href = agendaHref(item),
  className,
}: {
  item: AgendaItem
  today: LocalDate
  trailing?: ReactNode
  href?: string | null
  className?: string
}) {
  const f = useFormat()
  const lines = useSessionLines()
  const planned = item.kind === "planned"
  const canceled = !planned && item.status === "canceled"

  const detail = planned ? (
    <span className="text-xs text-muted-foreground">
      {lines.createdOn(createdOnOf(item, today), today)}
    </span>
  ) : (item.status === "active" || item.status === "completed") && counted(item) ? (
    <span className="text-xs text-muted-foreground tabular-nums">{lines.present(item)}</span>
  ) : canceled && item.cancelReason ? (
    <span dir="auto" className="max-w-64 text-xs text-pretty text-muted-foreground">
      {item.cancelReason}
    </span>
  ) : null

  const name = (
    <span
      className={cn(
        "truncate font-medium",
        canceled && "text-muted-foreground line-through decoration-1"
      )}
    >
      {groupOf(item)}
    </span>
  )

  const content = (
    <>
      <div className="w-14 shrink-0 text-center leading-none">
        <div className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          {f.todayOrWeekday(item.date, today)}
        </div>
        <div className="mt-1 font-heading text-xl font-semibold tabular-nums">
          {f.dayOfMonth(item.date)}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">{f.monthShort(item.date)}</div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          {name}
          <span dir="auto" className="hidden truncate text-sm text-muted-foreground sm:inline">
            · {item.title}
          </span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <ServiceTag service={item.service} className="text-xs" />
          <SessionWhen item={item} />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-end">
        {trailing ?? <SessionBadges item={item} />}
        {detail}
      </div>
    </>
  )

  const base = cn("flex min-w-0 items-center gap-3 py-3", planned && "opacity-80", className)

  return href ? (
    <Link href={href} className={cn(base, "-mx-2 px-2 hover:bg-muted/60")}>
      {content}
    </Link>
  ) : (
    <div className={base}>{content}</div>
  )
}
