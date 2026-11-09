"use client"

import { cn } from "cn"
import { CalendarX2, Clock, MapPin } from "lucide-react"
import { useTranslations } from "next-intl"

import { ServiceTag } from "@/components/service-tag"
import { useFormat } from "@/i18n/format"
import type { LocalDate } from "@/lib/api/types/common"

import type { MemberMeeting } from "./api"

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
