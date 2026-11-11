"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { ServiceSwatch } from "@/components/service-tag"
import { useFormat } from "@/i18n/format"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { preferredName } from "@/lib/domain/names"

import { endMembershipRequest, MEMBERSHIP_QUERIES, type PersonRow, type Placement } from "./api"
import { MembershipMenu } from "./membership-menu"
import { useWhere } from "./use-where"

export function Placements({ row }: { row: PersonRow }) {
  const t = useTranslations()
  const f = useFormat()
  const where = useWhere()
  const [ending, setEnding] = useState<Placement | null>(null)

  const end = useApiMutation(endMembershipRequest, {
    successMessage: t("toast.membershipEnded"),
    invalidate: MEMBERSHIP_QUERIES,
    awaitRefetch: true,
  })

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t("members.belongsTo")}
      </h3>
      {row.placements.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("members.sheet.noServiceNow")}</p>
      ) : (
        <ul className="flex flex-col divide-y border-y">
          {row.placements.map((placement) => (
            <li
              key={placement.membershipId}
              className="flex items-center justify-between gap-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <ServiceSwatch tone={placement.service.tone} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm">{where(placement)}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("members.sheet.since", { date: f.mediumDate(placement.startsOn) })}
                  </span>
                </span>
              </span>
              {row.person.status === "active" ? (
                <MembershipMenu
                  row={row}
                  placement={placement}
                  onRemove={() => setEnding(placement)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={ending !== null}
        onOpenChange={(open) => !open && setEnding(null)}
        title={
          ending
            ? t("members.membership.removeTitle", {
                name: preferredName(row.person),
                where: where(ending),
              })
            : ""
        }
        description={t("members.membership.removeDescription")}
        confirmLabel={t("members.membership.remove")}
        tone="destructive"
        onConfirm={async () => {
          if (!ending) {
            return true
          }

          return (await end.execute(ending.membershipId)).ok
        }}
      />
    </section>
  )
}

export function EarlierPlacements({ placements }: { placements: Placement[] }) {
  const t = useTranslations("members.sheet")
  const f = useFormat()
  const where = useWhere()

  if (placements.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t("earlier")}
      </h3>
      <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
        {placements.map((placement) => (
          <li key={placement.membershipId}>
            {t("pastPlacement", {
              where: where(placement),
              from: f.mediumDate(placement.startsOn),
              to: placement.endsOn ? f.mediumDate(placement.endsOn) : "",
            })}
          </li>
        ))}
      </ul>
    </section>
  )
}
