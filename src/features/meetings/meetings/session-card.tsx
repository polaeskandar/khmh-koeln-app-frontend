"use client"

import { cn } from "@/lib/utils"
import { UsersRound } from "lucide-react"
import type { ReactNode } from "react"

import { ServiceTag } from "@/components/service-tag"
import { RosterCells } from "@/features/meetings/attendance/roster-cells"
import { Link } from "@/i18n/navigation"
import type { LocalDate } from "@/lib/api/types/common"
import type { SessionView } from "./api"

import { agendaHref } from "./agenda-links"
import { SessionBadges } from "./session-badges"
import { counted, groupOf, useSessionLines } from "./session-lines"
import { SessionWhen } from "./session-when"

export function SessionCardView({
  session,
  today,
  action,
  href = agendaHref({ ...session, kind: "session" }),
  className,
}: {
  session: SessionView
  today: LocalDate
  action?: ReactNode
  href?: string | null
  className?: string
}) {
  const lines = useSessionLines()
  const canceled = session.status === "canceled"

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col gap-3 border bg-card p-4",
        session.status === "active" &&
          "border-primary/40 shadow-[inset_3px_0_0_var(--primary)] rtl:shadow-[inset_-3px_0_0_var(--primary)]",
        canceled && "bg-muted/40",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <ServiceTag service={session.service} className="text-xs" />
        <SessionBadges item={{ ...session, kind: "session" }} />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <h3
          className={cn(
            "font-heading text-lg leading-tight font-semibold tracking-tight",
            canceled && "text-muted-foreground line-through decoration-1"
          )}
        >
          {href ? (
            <Link href={href} className="hover:underline hover:underline-offset-4">
              {groupOf(session)}
            </Link>
          ) : (
            groupOf(session)
          )}
        </h3>
        <p dir="auto" className="truncate text-sm text-muted-foreground">
          {session.title}
        </p>
        <SessionWhen item={session} />
      </div>
      {!counted(session) ? (
        canceled && session.cancelReason ? (
          <p dir="auto" className="text-sm text-muted-foreground">
            {session.cancelReason}
          </p>
        ) : null
      ) : !canceled && session.rosterMode === "expected" && session.counts.rosterSize ? (
        <div className="flex flex-col gap-2">
          <RosterCells
            filled={session.counts.rosterPresent}
            total={session.counts.rosterSize}
            extra={session.counts.notOnRoster}
            size="md"
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
            <span className="font-medium tabular-nums">{lines.present(session)}</span>
            <span className="text-muted-foreground tabular-nums">
              {lines.remainder(session, today)}
            </span>
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {!canceled ? <UsersRound className="size-3.5" aria-hidden="true" /> : null}
          <span className="tabular-nums">
            {canceled
              ? lines.remainder(session, today)
              : `${lines.present(session)} · ${lines.remainder(session, today)}`}
          </span>
        </p>
      )}
      {action ? <div className="mt-auto flex flex-wrap gap-2 pt-1">{action}</div> : null}
    </article>
  )
}
