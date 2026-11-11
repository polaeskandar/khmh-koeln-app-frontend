import { useTranslations } from "next-intl"

import { useFormat } from "@/i18n/format"
import type { LocalDate, ServiceRef, StageRef } from "@/lib/api/types/common"
import type { PlannedItem, SessionView } from "@/lib/api/types/meetings"
import { isolate } from "@/lib/bidi"
import { addDays } from "@/lib/domain/time"
import type { Format } from "@/lib/format"

export type Placed = { service: ServiceRef | null; stage: StageRef | null }

export const groupOf = (item: Placed) => item.stage?.name ?? item.service?.name ?? ""

export function createdOnOf(planned: Pick<PlannedItem, "date">, today: LocalDate): LocalDate {
  const dayBefore = addDays(planned.date, -1)

  return dayBefore < today ? today : dayBefore
}

type SessionT = ReturnType<typeof useTranslations<"session">>
type Counted = Pick<SessionView, "status" | "rosterMode" | "cancelReason" | "date"> & {
  counts: NonNullable<SessionView["counts"]>
}

function sessionLines(t: SessionT, f: Format) {
  return {
    present(s: Counted): string {
      const c = s.counts

      if (s.rosterMode === "open" || c.rosterSize === null) {
        return t("present", { count: c.present })
      }

      const line = t("presentOf", { present: c.rosterPresent, total: c.rosterSize })

      return c.notOnRoster > 0 ? `${line} · ${t("notOnRoster", { count: c.notOnRoster })}` : line
    },
    remainder(s: Counted, today: LocalDate): string | null {
      const c = s.counts

      if (s.status === "canceled") {
        return s.cancelReason ? isolate(s.cancelReason) : t("canceled")
      }

      if (s.rosterMode === "open" || c.rosterSize === null) {
        return s.status === "scheduled" ? t("openRosterScheduled") : t("openRoster")
      }

      if (s.status === "active") {
        return c.notMarked === 0 ? t("everyoneHere") : t("notCheckedIn", { count: c.notMarked })
      }

      if (s.status === "completed") {
        return c.notMarked === 0
          ? t("everyoneWasPresent")
          : t("notMarkedPresent", { count: c.notMarked })
      }

      if (s.date < today) {
        return t("notTaken")
      }

      return t("onRoster", { count: c.rosterSize })
    },
    createdOn(createdOn: LocalDate, today: LocalDate): string {
      if (createdOn === today) {
        return t("createdToday")
      }

      if (createdOn === addDays(today, 1)) {
        return t("createdTomorrow")
      }

      return t("createdOn", { date: f.dayMonth(createdOn) })
    },
  }
}

export function useSessionLines() {
  return sessionLines(useTranslations("session"), useFormat())
}

export const counted = (s: SessionView): s is SessionView & Counted =>
  s.counts !== undefined && s.counts !== null
