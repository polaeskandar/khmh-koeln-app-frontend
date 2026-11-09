"use client"

import { BookOpen, Repeat, UsersRound } from "lucide-react"
import { useTranslations } from "next-intl"

import { ServiceTag } from "@/components/service-tag"
import { useFormat } from "@/i18n/format"
import type { LocalDate } from "@/lib/api/types/common"
import { isolate } from "@/lib/bidi"

import { recurrenceOf } from "@/lib/domain/recurrence"

import type { MemberGroup } from "./api"

export function GroupCard({ group, today }: { group: MemberGroup; today: LocalDate }) {
  const t = useTranslations("member.groups")
  const f = useFormat()
  const name = group.stage?.name ?? group.service.name

  const servants = group.servants.map((servant) =>
    servant.role === "service_leader"
      ? t("serviceLeader", { name: isolate(servant.name) })
      : isolate(servant.name)
  )

  return (
    <article className="flex flex-col gap-3 border p-4" aria-label={name}>
      <header className="flex flex-col gap-1">
        {group.stage ? <ServiceTag service={group.service} className="text-xs" /> : null}
        <h3 className="flex items-center gap-2 font-heading text-base leading-snug font-semibold tracking-tight">
          {group.stage ? null : <ServiceTag service={group.service} label="" />}
          <bdi>{name}</bdi>
        </h3>
      </header>
      {group.schedules.length > 0 ? (
        <ul className="flex flex-col gap-1.5 text-sm">
          {group.schedules.map((schedule) => (
            <li key={schedule.id} className="flex items-start gap-2">
              <Repeat
                className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span>
                {[
                  f.recurrence(recurrenceOf(schedule.recurrence)),
                  f.timeRange(schedule.startTime, schedule.endTime),
                  schedule.location,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noSchedule")}</p>
      )}
      {servants.length > 0 ? (
        <p className="flex items-start gap-2 text-sm">
          <UsersRound
            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span>{servants.join(f.separator)}</span>
        </p>
      ) : null}
      {group.lastLesson ? (
        <div className="flex flex-col gap-2 bg-muted/50 p-3">
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="size-3.5 shrink-0" aria-hidden="true" />
            {t("lastLesson", {
              title: isolate(group.lastLesson.title),
              date: f.relativeDayInline(group.lastLesson.teachingDate, today),
            })}
          </span>
          {group.lastLesson.passage ? (
            <p dir="auto" className="text-sm font-medium">
              {group.lastLesson.passage}
            </p>
          ) : null}
          {group.lastLesson.memoryVerse ? (
            <blockquote
              dir="auto"
              className="border-s-2 border-primary ps-3 font-heading text-sm leading-relaxed text-pretty"
            >
              {group.lastLesson.memoryVerse}
            </blockquote>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
