"use client"

import { useQuery } from "@tanstack/react-query"
import { Pencil, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { RecordNotFound } from "@/features/portals/staff/record-not-found"
import { Topbar } from "@/features/portals/staff/topbar"
import { MemberAvatar } from "@/components/member-avatar"
import { NoAccess } from "@/components/no-access"
import { PageBody, PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCanIn } from "@/features/identity/auth/session"
import { useStageCrumbs } from "@/features/organization/stages/stage-layout"
import { useFormat } from "@/i18n/format"
import { Link, useRouter } from "@/i18n/navigation"
import { ApiError } from "@/lib/api/problem"
import type { Uuid } from "@/lib/api/types/common"
import { isolate } from "@/lib/bidi"
import { initials, matchesQuery, preferredName } from "@/lib/domain/names"
import { oneOf } from "@/lib/one-of"
import { groupAt } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { HomeworkStatusBadge } from "./homework-status-badge"
import { CompletionMeter } from "./completion-meter"
import {
  homeworkFlagsFor,
  type HomeworkProgress,
  homeworkProgressQuery,
  homeworkQuery,
  type AudienceRow,
} from "./api"
import { HomeworkActions } from "./homework-actions"
import { DueLine } from "./due-line"

type Tab = "all" | "done" | "open" | "noAccount"

const TABS: Tab[] = ["all", "done", "open", "noAccount"]

const FILTERS: Record<Tab, (row: AudienceRow) => boolean> = {
  all: () => true,
  done: (row) => row.done,
  open: (row) => !row.done,
  noAccount: (row) => !row.ownAccount && row.parentAccounts.length === 0,
}

const TAB_LABEL = {
  all: "tabAll",
  done: "tabDone",
  open: "tabOpen",
  noAccount: "tabNoAccount",
} as const

function Figure({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="flex flex-col gap-1 border p-4">
      <dt className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="font-heading text-2xl font-semibold tabular-nums">{value}</dd>
      {note ? <dd className="text-xs text-muted-foreground">{note}</dd> : null}
    </div>
  )
}

function Figures({ progress }: { progress: HomeworkProgress }) {
  const t = useTranslations("homework")

  if (!progress.counts) {
    return <p className="border border-dashed p-4 text-sm">{t("progress.draftNote")}</p>
  }

  const late = progress.rows.filter((row) => row.done && row.completedAfterDueDate).length

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Figure
        label={t("progress.childrenIn", { stage: progress.stage.name })}
        value={progress.counts.assigned}
      />
      <Figure
        label={t("progress.reportedDone")}
        value={progress.counts.completed}
        note={late > 0 ? t("progress.afterDue", { count: late }) : undefined}
      />
      <Figure label={t("notYet")} value={progress.counts.notCompleted} />
      <Figure
        label={t("progress.withoutAccount")}
        value={progress.counts.withoutAccount}
        note={t("progress.cantReportOnline")}
      />
    </dl>
  )
}

function Reported({ row, today }: { row: AudienceRow; today: string }) {
  const t = useTranslations()
  const f = useFormat()

  if (!row.done || !row.completedAt) {
    return <span className="text-muted-foreground">{t("homework.notYet")}</span>
  }

  return (
    <span className="flex flex-col gap-0.5">
      <span className="font-medium text-success">{t("homework.completion.done")}</span>
      <span className="text-xs text-muted-foreground">
        {f.instantLabel(row.completedAt, today)} ·{" "}
        {row.reportedBySelf && row.completedBy ? (
          t("homework.completion.bySelf", { name: isolate(row.completedBy.name) })
        ) : (
          <bdi>{row.completedBy?.name ?? t("common.formerAccount")}</bdi>
        )}
        {row.completedAfterDueDate ? <> · {t("homework.completion.afterDue")}</> : null}
      </span>
    </span>
  )
}

function Accounts({ row }: { row: AudienceRow }) {
  const t = useTranslations()

  const accounts = [
    row.ownAccount ? t("homework.completion.ownAccount") : null,
    row.parentAccounts.length > 0
      ? t("counts.parents", { count: row.parentAccounts.length })
      : null,
  ].filter(Boolean)

  return accounts.length > 0 ? accounts.join(" · ") : t("homework.completion.noAccount")
}

function Completion({ progress }: { progress: HomeworkProgress }) {
  const t = useTranslations()
  const [tab, setTab] = useState<Tab>("all")
  const [searchText, setSearchText] = useState("")

  const rows = progress.rows.filter(
    (row) => FILTERS[tab](row) && matchesQuery(row.person, searchText)
  )

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(value) => setTab(oneOf(TABS, value) ?? tab)}>
          <TabsList className="flex-wrap">
            {TABS.map((key) => (
              <TabsTrigger key={key} value={key}>
                {t(`homework.completion.${TAB_LABEL[key]}`, {
                  count: progress.rows.filter(FILTERS[key]).length,
                })}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative sm:w-64">
          <Search
            className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            className="ps-8"
            aria-label={t("homework.completion.searchLabel")}
            placeholder={t("homework.completion.searchPlaceholder")}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>
      </div>
      {rows.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>
              {searchText.trim()
                ? t("homework.completion.noMatch")
                : t("homework.completion.empty")}
            </EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <th scope="col" className="px-3 py-2 text-start">
                  {t("homework.completion.child")}
                </th>
                <th scope="col" className="px-3 py-2 text-start">
                  {t("homework.completion.reported")}
                </th>
                <th scope="col" className="px-3 py-2 text-start">
                  {t("homework.completion.accounts")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const name = preferredName(row.person)

                return (
                  <tr key={row.person.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-3">
                        <MemberAvatar
                          name={name}
                          initials={initials(row.person)}
                          seed={row.person.id}
                        />
                        <span className="flex min-w-0 flex-col">
                          <span dir="auto" className="font-medium">
                            {name}
                          </span>
                          {row.inStage ? null : (
                            <span className="text-xs text-muted-foreground">
                              {t("homework.completion.leftStage", { stage: progress.stage.name })}
                            </span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Reported row={row} today={progress.today} />
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      <Accounts row={row} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function WhatParentsRead({ progress }: { progress: HomeworkProgress }) {
  const t = useTranslations("homework")

  return (
    <aside className="flex min-w-0 flex-col gap-4 border p-5 lg:self-start">
      <h2 className="text-xs font-semibold tracking-wider uppercase">
        {t("progress.whatParentsRead")}
      </h2>
      <p dir="auto" className="text-sm whitespace-pre-line">
        {progress.homework.instructions}
      </p>
      {progress.homework.resources.length > 0 ? (
        <ul className="flex flex-col gap-1.5 text-sm">
          {progress.homework.resources.map((resource, index) => (
            <li key={index} dir="auto">
              {resource.url ? (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  {resource.label}
                </a>
              ) : (
                resource.label
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {progress.counts ? (
        <CompletionMeter
          completed={progress.counts.completed}
          assigned={progress.counts.assigned}
        />
      ) : null}
    </aside>
  )
}

function ProgressView({ progress }: { progress: HomeworkProgress }) {
  const t = useTranslations()
  const f = useFormat()
  const router = useRouter()
  const group = groupAt(progress.service, progress.stage)
  const can = useCanIn(group)
  const { homework, lesson } = progress
  const detail = useQuery(homeworkQuery(homework.id))
  const stageArchived = detail.data?.archived ?? true
  const flags = homeworkFlagsFor(can, homework, stageArchived)

  const crumbs = useStageCrumbs({ ...progress.stage, service: progress.service }, "homework", [
    { label: homework.title },
  ])

  return (
    <>
      <Topbar crumbs={crumbs} />
      <PageBody>
        <PageHeader
          meta={
            <>
              <HomeworkStatusBadge status={homework.status} />
              <DueLine dueDate={homework.dueDate} today={progress.today} />
            </>
          }
          title={homework.title}
          description={t.rich("homework.progress.lessonOn", {
            lesson: lesson.title,
            date: f.dayMonth(lesson.teachingDate),
            link: (chunks) => (
              <Link href={routes.lesson(lesson.id)} className="underline underline-offset-4">
                <bdi>{chunks}</bdi>
              </Link>
            ),
          })}
          actions={
            <>
              {flags.edit ? (
                <Button variant="outline" asChild>
                  <Link href={routes.editHomework(homework.id)}>
                    <Pencil data-icon="inline-start" />
                    {t("common.edit")}
                  </Link>
                </Button>
              ) : null}
              <HomeworkActions
                homework={homework}
                group={group}
                stageArchived={stageArchived}
                place="page"
                onDeleted={() => router.push(routes.stageHomework(progress.stage.id))}
              />
            </>
          }
        />
        <Figures progress={progress} />
        <p className="max-w-[80ch] text-sm text-muted-foreground">{t("homework.progress.note")}</p>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <Completion progress={progress} />
          <WhatParentsRead progress={progress} />
        </div>
      </PageBody>
    </>
  )
}

function Progress({ id }: { id: Uuid }) {
  const t = useTranslations()
  const query = useQuery(homeworkProgressQuery(id))

  if (query.error instanceof ApiError && query.error.status === 403) {
    return (
      <PageBody>
        <NoAccess title={t("homework.progress.noAccessTitle")}>{t("errors.forbidden")}</NoAccess>
      </PageBody>
    )
  }

  return (
    <QueryState query={query} notFound={<RecordNotFound area="services" />}>
      {(progress) => <ProgressView progress={progress} />}
    </QueryState>
  )
}

export function HomeworkProgressPage() {
  return (
    <RecordPage notFound={<RecordNotFound area="services" />}>
      {(id) => <Progress id={id} />}
    </RecordPage>
  )
}
