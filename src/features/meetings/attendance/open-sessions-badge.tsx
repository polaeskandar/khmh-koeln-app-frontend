"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

import { LiveDot } from "@/components/status"
import { SidebarMenuBadge } from "@/components/ui/sidebar"

import { attendanceOverviewQuery } from "./api"

const REFRESH_MS = 60_000

export function useOpenCount(): number {
  const query = useQuery({
    ...attendanceOverviewQuery,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  })

  return query.isError ? 0 : (query.data?.openCount ?? 0)
}

export function OpenSessionsBadge() {
  const t = useTranslations("nav")
  const count = useOpenCount()

  if (count === 0) {
    return null
  }

  return (
    <SidebarMenuBadge className="gap-1.5 text-success">
      <LiveDot />
      {t("openSessions", { count })}
    </SidebarMenuBadge>
  )
}

export function OpenSessionsBubble({ id }: { id: string }) {
  const t = useTranslations("nav")
  const count = useOpenCount()

  if (count === 0) {
    return null
  }

  return (
    <>
      <span
        aria-hidden="true"
        className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center bg-success px-1 text-[11px] font-semibold text-success-foreground tabular-nums ring-2 ring-background"
      >
        {count}
      </span>
      <span id={id} className="sr-only">
        {t("openSessions", { count })}
      </span>
    </>
  )
}
