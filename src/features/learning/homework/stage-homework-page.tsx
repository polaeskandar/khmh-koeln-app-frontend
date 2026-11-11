"use client"

import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

import { Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCanIn } from "@/features/identity/auth/session"
import { CompletionMeter } from "./completion-meter"
import { HomeworkStatusBadge } from "./homework-status-badge"
import type { Stage } from "@/features/organization/stages/api"
import { StageLayout } from "@/features/organization/stages/stage-layout"
import { useFormat } from "@/i18n/format"
import { Link, useRouter } from "@/i18n/navigation"
import { oneOf } from "@/lib/one-of"
import { type Group, groupAt } from "@/lib/permissions"
import { routes } from "@/lib/routes"

import { type HomeworkList, stageHomeworkQuery } from "./api"
import { HomeworkActions } from "./homework-actions"
import { DueLine } from "./due-line"

type Tab = "published" | "draft" | "archived"
const TABS: Tab[] = ["published", "draft", "archived"]
const TAB_LABEL = { published: "published", draft: "drafts", archived: "archived" } as const

function defaultTab(list: HomeworkList): Tab {
  return list.tabs.published === 0 && list.tabs.draft > 0 ? "draft" : "published"
}

function Rows({ list, tab, group }: { list: HomeworkList; tab: Tab; group: Group }) {
  const t = useTranslations("homework")
  const f = useFormat()
  const rows = list.items.filter((row) => row.status === tab)

  if (rows.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyTitle>{t(`table.empty.${tab}.title`)}</EmptyTitle>
          <EmptyDescription>{t(`table.empty.${tab}.text`)}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="overflow-x-auto border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/40">
          <tr className="border-b text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <th scope="col" className="px-3 py-2 text-start">
              {t("table.homework")}
            </th>
            <th scope="col" className="px-3 py-2 text-start">
              {t("table.due")}
            </th>
            <th scope="col" className="px-3 py-2 text-start">
              {t("table.status")}
            </th>
            <th scope="col" className="px-3 py-2 text-start">
              {t("table.reported")}
            </th>
            <th scope="col" className="w-12 px-3 py-2">
              <span className="sr-only">{t("table.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-b-0">
              <td className="px-3 py-3">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <Link
                    href={
                      row.status === "draft" ? routes.editHomework(row.id) : routes.homework(row.id)
                    }
                    dir="auto"
                    className="font-medium hover:underline hover:underline-offset-4"
                  >
                    {row.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    <span dir="auto">{row.lesson.title}</span> ·{" "}
                    {f.relativeDay(row.lesson.teachingDate, list.today)}
                  </span>
                </span>
              </td>
              <td className="px-3 py-3">
                <DueLine dueDate={row.dueDate} today={list.today} />
              </td>
              <td className="px-3 py-3">
                <HomeworkStatusBadge status={row.status} />
              </td>
              <td className="px-3 py-3">
                {row.counts ? (
                  <span className="flex flex-col gap-1">
                    <CompletionMeter
                      completed={row.counts.completed}
                      assigned={row.counts.assigned}
                    />
                    {row.counts.withoutAccount > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {t("childrenWithoutAccount", { count: row.counts.withoutAccount })}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">{t("hiddenFromParents")}</span>
                )}
              </td>
              <td className="px-3 py-3 text-end">
                <HomeworkActions
                  homework={row}
                  group={group}
                  stageArchived={list.archived}
                  place="list"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Homework({ stage }: { stage: Stage }) {
  const t = useTranslations("homework")
  const group = groupAt(stage.service, stage)
  const can = useCanIn(group)
  const search = useSearchParams()
  const router = useRouter()
  const query = useQuery(stageHomeworkQuery(stage.id))
  const requested = search.get("status")

  return (
    <QueryState query={query}>
      {(list) => {
        const tab = oneOf(TABS, requested) ?? defaultTab(list)
        const creatable = !list.archived && can("create", "homework")

        return (
          <Section
            id="homework"
            title={t("title")}
            description={t("list.description", { stage: stage.name })}
            actions={
              creatable && list.lessons.length > 0 ? (
                <Button asChild>
                  <Link href={routes.newHomework(stage.id)}>
                    <Plus data-icon="inline-start" />
                    {t("newHomework")}
                  </Link>
                </Button>
              ) : null
            }
          >
            {creatable && list.lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.rich("list.needsLesson", {
                  link: (chunks) => (
                    <Link
                      href={routes.newLesson(stage.id)}
                      className="underline underline-offset-4"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            ) : null}
            <Tabs
              value={tab}
              onValueChange={(value) =>
                router.replace(`${routes.stageHomework(stage.id)}&status=${value}`)
              }
            >
              <TabsList>
                {TABS.map((key) => (
                  <TabsTrigger key={key} value={key}>
                    {t(`table.${TAB_LABEL[key]}`, { count: list.tabs[key] })}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Rows list={list} tab={tab} group={group} />
          </Section>
        )
      }}
    </QueryState>
  )
}

export function StageHomeworkPage() {
  return <StageLayout tab="homework">{(stage) => <Homework stage={stage} />}</StageLayout>
}
