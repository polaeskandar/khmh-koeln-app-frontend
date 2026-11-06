"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { MemberAvatar } from "@/components/member-avatar"
import { Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { peopleQuery, type PeopleList } from "@/features/members/api"
import { useFormat } from "@/i18n/format"
import { fullName, initials, preferredName } from "@/lib/domain/names"

import type { Stage } from "./api"

function MemberRows({ stage, list }: { stage: Stage; list: PeopleList }) {
  const t = useTranslations("stages.overview")
  const f = useFormat()

  if (list.total === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyTitle>{t("empty")}</EmptyTitle>
          <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <ul className="divide-y border-y">
      {list.items.map(({ person, placements }) => {
        const since = placements.find((p) => p.stage?.id === stage.id)?.startsOn

        const detail = [
          person.displayName ? fullName(person) : null,
          since ? t("since", { date: f.mediumDate(since) }) : null,
        ]
          .filter(Boolean)
          .join(" · ")

        return (
          <li key={person.id} className="flex min-w-0 items-center gap-3 py-2.5">
            <MemberAvatar
              name={preferredName(person)}
              initials={initials(person)}
              seed={person.id}
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{preferredName(person)}</span>
              {detail ? (
                <span className="truncate text-xs text-muted-foreground">{detail}</span>
              ) : null}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function Pager({ list, onPage }: { list: PeopleList; onPage: (page: number) => void }) {
  const t = useTranslations("table")
  const pages = Math.ceil(list.total / list.pageSize)

  if (pages <= 1) {
    return null
  }

  const start = (list.page - 1) * list.pageSize + 1

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span className="tabular-nums">
        {t("showing", { start, end: start + list.items.length - 1, total: list.total })}
      </span>
      <span className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={list.page <= 1}
          onClick={() => onPage(list.page - 1)}
        >
          {t("previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={list.page >= pages}
          onClick={() => onPage(list.page + 1)}
        >
          {t("next")}
        </Button>
      </span>
    </div>
  )
}

export function StageMembers({ stage }: { stage: Stage }) {
  const t = useTranslations("stages.overview")
  const [page, setPage] = useState(1)

  const query = useQuery({
    ...peopleQuery({ stageId: stage.id, page }),
    placeholderData: keepPreviousData,
  })

  return (
    <Section id="members" title={t("members", { count: query.data?.total ?? stage.memberCount })}>
      <QueryState
        query={query}
        loading={
          <div aria-busy="true" className="flex flex-col gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        }
      >
        {(list) => (
          <div className="flex flex-col gap-4">
            <MemberRows stage={stage} list={list} />
            <Pager list={list} onPage={setPage} />
          </div>
        )}
      </QueryState>
    </Section>
  )
}
