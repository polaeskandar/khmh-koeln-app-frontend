"use client"

import { useQuery } from "@tanstack/react-query"
import { ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { MemberAvatar } from "@/components/member-avatar"
import { QueryState } from "@/components/page-states"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

import { type ChildSummary, parentChildrenQuery } from "./api"
import { ListSkeleton } from "@/features/learning/homework/task-list"

function ChildCard({ child }: { child: ChildSummary }) {
  const t = useTranslations("parent.children")

  return (
    <Link
      href={routes.parentHomework(child.id)}
      className="flex items-center gap-4 border p-5 transition-colors hover:bg-muted/60"
    >
      <MemberAvatar
        name={child.fullName}
        initials={child.initials}
        seed={child.id}
        className="size-12 text-base"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span dir="auto" className="font-heading text-lg leading-tight font-semibold">
          {child.fullName}
        </span>
        <span className="text-sm text-muted-foreground">
          {child.stage ? (
            <>
              <bdi>{child.stage}</bdi>
              {child.service ? (
                <>
                  {" · "}
                  <bdi>{child.service}</bdi>
                </>
              ) : null}
            </>
          ) : (
            t("noClass")
          )}
        </span>
        <span className="text-sm">
          {child.toDo > 0
            ? t.rich("toDo", {
                count: child.toDo,
                num: (chunks) => <span className="font-semibold tabular-nums">{chunks}</span>,
              })
            : t("nothingToDo")}
          <span className="text-muted-foreground"> · {t("done", { count: child.done })}</span>
        </span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
        aria-hidden="true"
      />
    </Link>
  )
}

export function ParentChildren() {
  const t = useTranslations("parent")
  const query = useQuery(parentChildrenQuery)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {t("nav.children")}
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">{t("children.description")}</p>
      </header>
      <QueryState query={query} loading={<ListSkeleton />}>
        {(data) =>
          data.items.length === 0 ? (
            <p className="border border-dashed p-5 text-sm text-muted-foreground">
              {t("children.empty")}
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {data.items.map((child) => (
                <li key={child.id} className="min-w-0">
                  <ChildCard child={child} />
                </li>
              ))}
            </ul>
          )
        }
      </QueryState>
      <p className="max-w-prose text-sm text-muted-foreground">{t("children.help")}</p>
    </div>
  )
}
