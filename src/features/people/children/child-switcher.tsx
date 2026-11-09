"use client"

import { cn } from "cn"
import { useTranslations } from "next-intl"

import { MemberAvatar } from "@/components/member-avatar"
import { Link } from "@/i18n/navigation"
import type { Uuid } from "@/lib/api/types/common"

import type { ChildSummary } from "./api"

export function ChildSwitcher({
  items,
  selectedId,
  href,
}: {
  items: ChildSummary[]
  selectedId: Uuid
  href: (child: Uuid) => string
}) {
  const t = useTranslations("parent.switcher")

  return (
    <nav aria-label={t("label")} className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex min-w-max gap-2">
        {items.map((child) => {
          const current = child.id === selectedId

          return (
            <li key={child.id}>
              <Link
                href={href(child.id)}
                scroll={false}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex h-14 items-center gap-3 border px-3 pe-4 transition-colors hover:bg-muted/60",
                  current && "border-foreground bg-muted/40 ring-1 ring-foreground"
                )}
              >
                <MemberAvatar name={child.fullName} initials={child.initials} seed={child.id} />
                <span className="flex flex-col leading-tight">
                  <span dir="auto" className="text-sm font-semibold">
                    {child.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {child.stage ?? t("noClass")} ·{" "}
                    {child.toDo > 0 ? t("toDo", { count: child.toDo }) : t("allDone")}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
