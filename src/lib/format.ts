import type { Locale } from "@/i18n/config"
import { daysBetween, isoWeekday, localDateOf, localTimeOf, parseDate } from "@/lib/domain/time"
import type {
  Instant,
  IsoWeekday,
  LocalDate,
  LocalTime,
  MonthWeek,
  Recurrence,
} from "@/lib/api/types/common"

import { TABLES } from "./format-tables"
import { WORDS } from "./format-words"

type Parts = { year: number; month: number; day: number; weekday: IsoWeekday }

const partsOf = (date: LocalDate): Parts => {
  const [year, month, d] = parseDate(date)

  return { year, month, day: d, weekday: isoWeekday(date) }
}

const COPTIC_EPOCH = 1825030

function julianDay(date: LocalDate): number {
  const [y, m, d] = parseDate(date)
  const a = Math.floor((14 - m) / 12)
  const yy = y + 4800 - a
  const mm = m + 12 * a - 3

  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  )
}

function copticParts(date: LocalDate) {
  const jd = julianDay(date)
  const year = Math.floor((4 * (jd - COPTIC_EPOCH) + 1463) / 1461)
  const startOfYear = COPTIC_EPOCH + 365 * (year - 1) + Math.floor(year / 4)
  const dayOfYear = jd - startOfYear
  const month = Math.floor(dayOfYear / 30)

  return { year, month, day: dayOfYear - month * 30 + 1 }
}

function create(locale: Locale) {
  const t = TABLES[locale]
  const w = WORDS[locale]
  const weekdayLong = (date: LocalDate) => t.weekdays[partsOf(date).weekday - 1]
  const weekdayShort = (date: LocalDate) => t.weekdaysShort[partsOf(date).weekday - 1]

  const longDate = (date: LocalDate) => {
    const p = partsOf(date)
    const month = t.months[p.month - 1]

    if (locale === "de") {
      return `${weekdayLong(date)}, ${p.day}. ${month} ${p.year}`
    }

    if (locale === "ar") {
      return `${weekdayLong(date)}، ${p.day} ${month} ${p.year}`
    }

    return `${weekdayLong(date)} ${p.day} ${month} ${p.year}`
  }

  const dayMonth = (date: LocalDate) => {
    const p = partsOf(date)
    const month = t.monthsShort[p.month - 1]

    if (locale === "de") {
      return `${weekdayShort(date)}, ${p.day}. ${month}`
    }

    if (locale === "ar") {
      return `${weekdayShort(date)}، ${p.day} ${month}`
    }

    return `${weekdayShort(date)} ${p.day} ${month}`
  }

  const shortDate = (date: LocalDate) => {
    const p = partsOf(date)

    return `${p.day}${locale === "de" ? "." : ""} ${t.monthsShort[p.month - 1]}`
  }

  const todayOrYesterday = (date: LocalDate, today: LocalDate): string | null => {
    const diff = daysBetween(today, date)

    if (diff === 0) {
      return w.today
    }

    if (diff === -1) {
      return w.yesterday
    }

    return null
  }

  const relativeWord = (date: LocalDate, today: LocalDate): string | null =>
    todayOrYesterday(date, today) ?? (daysBetween(today, date) === 1 ? w.tomorrow : null)

  return {
    locale,
    separator: locale === "ar" ? "، " : ", ",
    longDate,
    mediumDate: (date: LocalDate) => `${dayMonth(date)} ${partsOf(date).year}`,
    dayMonth,
    shortDate,
    monthShort: (date: LocalDate) => t.monthsShort[partsOf(date).month - 1],
    weekdayLong,
    weekdayShort,
    dayOfMonth: (date: LocalDate) => partsOf(date).day,
    weekdayName: (d: IsoWeekday) => t.weekdays[d - 1],
    weekdayMin: (d: IsoWeekday) => t.weekdaysMin[d - 1],
    monthWeekName: (week: MonthWeek) => w.monthWeek[week],
    relativeDay(date: LocalDate, today: LocalDate, style: "short" | "long" = "short"): string {
      return relativeWord(date, today) ?? (style === "long" ? longDate(date) : dayMonth(date))
    },
    relativeDayInline(date: LocalDate, today: LocalDate): string {
      const word = relativeWord(date, today)

      if (!word) {
        return dayMonth(date)
      }

      return locale === "ar" ? word : word.toLowerCase()
    },
    todayOrWeekday: (date: LocalDate, today: LocalDate) =>
      date === today ? w.today : weekdayShort(date),
    timeRange: (start: LocalTime, end: LocalTime | null) => (end ? `${start}–${end}` : start),
    instantTime: (instant: Instant) => localTimeOf(instant),
    instantDate: (instant: Instant) => localDateOf(instant),
    instantLabel(instant: Instant, today: LocalDate): string {
      const date = localDateOf(instant)
      const time = localTimeOf(instant)
      const recent = todayOrYesterday(date, today)

      if (recent) {
        return `${recent} ${time}`
      }

      return `${dayMonth(date)}${locale === "ar" ? "،" : ","} ${time}`
    },
    atLabel(instant: Instant, today: LocalDate): string {
      const date = localDateOf(instant)
      const recent = todayOrYesterday(date, today)

      return w.at(recent ?? dayMonth(date), localTimeOf(instant), recent !== null)
    },
    copticDate(date: LocalDate): string {
      const c = copticParts(date)

      return `${c.day}${locale === "de" ? "." : ""} ${t.copticMonths[c.month]} ${w.copticYear(c.year)}`
    },
    percent: (ratio: number) => w.percent(Math.round(ratio * 100)),
    list: (items: string[]) => w.list(items),
    recurrence: (r: Recurrence) => w.recurrence(r, t),
  }
}

export type Format = ReturnType<typeof create>

const cache = new Map<Locale, Format>()

export function formatFor(locale: Locale): Format {
  let f = cache.get(locale)

  if (!f) {
    f = create(locale)
    cache.set(locale, f)
  }

  return f
}
