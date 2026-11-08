"use client"

import { cn } from "cn"
import { BookOpen, CalendarX2, Clock, MapPin, Repeat, UsersRound } from "lucide-react"
import { useTranslations } from "next-intl"

import { ServiceTag } from "@/components/service-tag"
import { useFormat } from "@/i18n/format"
import type { LocalDate } from "@/lib/api/types/common"
import { isolate } from "@/lib/bidi"

import type { MemberGroup } from "@/features/people/member/api"
import type { MemberMeeting } from "@/features/meetings/member/api"
import { recurrenceOf } from "@/lib/domain/recurrence"

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

export function MeetingList({ meetings, today }: { meetings: MemberMeeting[]; today: LocalDate }) {
  const t = useTranslations("member.meetings")
  const f = useFormat()

  if (meetings.length === 0) {
    return <p className="border border-dashed p-5 text-sm text-muted-foreground">{t("empty")}</p>
  }

  return (
    <ul className="flex flex-col divide-y border-y">
      {meetings.map((meeting) => {
        const canceled = meeting.status === "canceled"

        return (
          <li key={meeting.key} className="flex items-start gap-4 py-3">
            <span
              className={cn(
                "flex w-12 shrink-0 flex-col items-center border py-1.5 leading-none",
                meeting.date === today && !canceled && "border-foreground"
              )}
              aria-hidden="true"
            >
              <span className="text-[11px] text-muted-foreground">
                {f.todayOrWeekday(meeting.date, today)}
              </span>
              <span className="font-heading text-lg font-semibold tabular-nums">
                {f.dayOfMonth(meeting.date)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {f.monthShort(meeting.date)}
              </span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="sr-only">{f.relativeDay(meeting.date, today, "long")}</span>
              <span
                className={cn(
                  "leading-snug font-medium",
                  canceled && "text-muted-foreground line-through"
                )}
              >
                <bdi>{meeting.group}</bdi>
                <span className="font-normal text-muted-foreground">
                  {" · "}
                  <bdi>{meeting.title}</bdi>
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {f.timeRange(meeting.startTime, meeting.endTime)}
                </span>
                {meeting.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    <bdi>{meeting.location}</bdi>
                  </span>
                ) : null}
                <ServiceTag service={meeting.service} />
              </span>
              {canceled ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <CalendarX2 className="size-3.5" aria-hidden="true" />
                  {t("canceled")}
                </span>
              ) : null}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
