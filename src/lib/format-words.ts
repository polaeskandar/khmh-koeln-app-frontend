import type { Locale } from "@/i18n/config"
import { MONTH_WEEKS } from "@/lib/domain/recurrence"
import type { IsoWeekday, MonthWeek, Recurrence } from "@/lib/api/types/common"

import type { Table } from "./format-tables"

type Words = {
  today: string
  tomorrow: string
  yesterday: string
  at: (day: string, time: string, relative: boolean) => string
  copticYear: (year: number) => string
  list: (items: string[]) => string
  percent: (n: number) => string
  recurrence: (r: Recurrence, t: Table) => string
  monthWeek: Record<MonthWeek, string>
}

const byMonthWeek = (names: string[]) =>
  Object.fromEntries(MONTH_WEEKS.map((w, i) => [w, names[i]])) as Record<MonthWeek, string>

const day = (t: Table, d: IsoWeekday) => t.weekdays[d - 1]

const GERMAN_ORDINALS = byMonthWeek(["ersten", "zweiten", "dritten", "vierten", "letzten"])

const ARABIC_ORDINALS = byMonthWeek(["أول", "ثاني", "ثالث", "رابع", "آخر"])

export const WORDS: Record<Locale, Words> = {
  en: {
    today: "Today",
    tomorrow: "Tomorrow",
    yesterday: "Yesterday",
    at: (d, time, relative) => (relative ? `${d.toLowerCase()} at ${time}` : `on ${d} at ${time}`),
    copticYear: (y) => `${y} A.M.`,
    list: (items) =>
      items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`,
    percent: (n) => `${n}%`,
    monthWeek: byMonthWeek(["First", "Second", "Third", "Fourth", "Last"]),
    recurrence(r, t) {
      const days = WORDS.en.list(r.weekdays.map((d) => day(t, d)))

      if (r.frequency === "weekly") {
        if (r.interval === 1) {
          return `Every ${days}`
        }

        if (r.interval === 2) {
          return `Every other ${days}`
        }

        return `Every ${r.interval} weeks on ${days}`
      }

      const which = `${WORDS.en.monthWeek[r.monthWeek ?? 1]} ${day(t, r.weekdays[0])}`

      return r.interval === 1 ? `${which} of every month` : `${which} of every ${r.interval} months`
    },
  },
  de: {
    today: "Heute",
    tomorrow: "Morgen",
    yesterday: "Gestern",
    at: (d, time, relative) => (relative ? `${d.toLowerCase()} um ${time}` : `am ${d}, um ${time}`),
    copticYear: (y) => `${y} A.M.`,
    list: (items) =>
      items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} und ${items.at(-1)}`,
    percent: (n) => `${n} %`,
    monthWeek: byMonthWeek(["Erster", "Zweiter", "Dritter", "Vierter", "Letzter"]),
    recurrence(r, t) {
      const days = WORDS.de.list(r.weekdays.map((d) => day(t, d)))

      if (r.frequency === "weekly") {
        if (r.interval === 1) {
          return `Jeden ${days}`
        }

        if (r.interval === 2) {
          return `Jeden zweiten ${days}`
        }

        return `Alle ${r.interval} Wochen am ${days}`
      }

      const ordinal = GERMAN_ORDINALS[r.monthWeek ?? 1]
      const weekday = day(t, r.weekdays[0])

      return r.interval === 1
        ? `Jeden ${ordinal} ${weekday} im Monat`
        : `Alle ${r.interval} Monate am ${ordinal} ${weekday}`
    },
  },
  ar: {
    today: "اليوم",
    tomorrow: "غدًا",
    yesterday: "أمس",
    at: (d, time, relative) => (relative ? `${d} الساعة ${time}` : `يوم ${d} الساعة ${time}`),
    copticYear: (y) => `${y} ش`,
    list: (items) =>
      items.length <= 1 ? items.join("") : `${items.slice(0, -1).join("، ")} و${items.at(-1)}`,
    percent: (n) => `${n}%`,
    monthWeek: byMonthWeek(["الأول", "الثاني", "الثالث", "الرابع", "الأخير"]),
    recurrence(r, t) {
      const indefinite = (d: IsoWeekday) => t.weekdaysMin[d - 1]
      const days = WORDS.ar.list(r.weekdays.map((d) => day(t, d)))

      if (r.frequency === "weekly") {
        if (r.interval === 1) {
          return r.weekdays.length === 1
            ? `كل يوم ${indefinite(r.weekdays[0])}`
            : `${days} من كل أسبوع`
        }

        if (r.interval === 2) {
          return `${days} كل أسبوعين`
        }

        return `${days} كل ${r.interval} أسابيع`
      }

      const ordinal = ARABIC_ORDINALS[r.monthWeek ?? 1]
      const which = `${ordinal} ${indefinite(r.weekdays[0])}`

      if (r.interval === 1) {
        return `${which} من كل شهر`
      }

      if (r.interval === 2) {
        return `${which} كل شهرين`
      }

      return `${which} كل ${r.interval} ${r.interval <= 10 ? "أشهر" : "شهرًا"}`
    },
  },
}
