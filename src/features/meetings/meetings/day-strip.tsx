"use client"

import { cn } from "cn"
import { useTranslations } from "next-intl"

import { toneOf } from "@/components/service-tag"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import type { LocalDate } from "@/lib/api/types/common"

const MAX_SQUARES = 5

export function DayStrip({
  days,
  selected,
  today,
  href,
}: {
  days: { date: LocalDate; tones: number[]; count: number }[]
  selected: LocalDate
  today: LocalDate
  href: (date: LocalDate) => string
}) {
  const t = useTranslations("meetings")
  const f = useFormat()

  return (
    <nav aria-label={t("days.label")} className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ol className="grid min-w-[760px] grid-cols-14 border-y border-s">
        {days.map((day) => {
          const current = day.date === selected

          return (
            <li key={day.date} className="border-e">
              <Link
                href={href(day.date)}
                aria-current={current ? "date" : undefined}
                aria-label={t("days.day", { date: f.dayMonth(day.date), count: day.count })}
                className={cn(
                  "flex h-20 flex-col items-center justify-between py-2 transition-colors hover:bg-muted/60",
                  day.date < today && !current && "text-muted-foreground",
                  current && "bg-foreground text-background hover:bg-foreground/90"
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold tracking-widest uppercase",
                    day.date === today && !current && "text-primary"
                  )}
                >
                  {f.todayOrWeekday(day.date, today)}
                </span>
                <span className="font-heading text-xl leading-none font-semibold tabular-nums">
                  {f.dayOfMonth(day.date)}
                </span>
                <span className="flex h-2 items-center gap-0.5" aria-hidden="true" data-squares>
                  {day.tones.slice(0, MAX_SQUARES).map((tone, index) => (
                    <span
                      key={index}
                      className="size-1.5"
                      style={{ background: `var(--identity-${toneOf(tone)})` }}
                    />
                  ))}
                  {day.tones.length > MAX_SQUARES ? (
                    <span className="text-[9px] leading-none">+</span>
                  ) : null}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
