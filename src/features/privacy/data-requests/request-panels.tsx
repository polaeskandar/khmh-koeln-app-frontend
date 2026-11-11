"use client"

import { useTranslations } from "next-intl"

import { FormPanel } from "@/components/form-panel"
import { useFormat } from "@/i18n/format"
import { isolate } from "@/lib/bidi"
import { preferredName } from "@/lib/domain/names"

import { type DataRequestDetail, groupOfMembership, subjectGone } from "./api"
import { DueLabel } from "./request-labels"

export function RequestFacts({ detail }: { detail: DataRequestDetail }) {
  const t = useTranslations("privacy")
  const f = useFormat()
  const { request } = detail

  return (
    <FormPanel title={t("detail.request")}>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("detail.received")}</dt>
        <dd>{f.mediumDate(f.instantDate(request.receivedAt))}</dd>
        <dt className="text-muted-foreground">{t("detail.channel")}</dt>
        <dd>{t(`channel.${request.channel}`)}</dd>
        {request.status === "open" ? (
          <>
            <dt className="text-muted-foreground">{t("detail.due")}</dt>
            <dd>
              <DueLabel dueOn={request.dueOn} today={detail.today} />
            </dd>
          </>
        ) : null}
      </dl>
      {request.note ? (
        <p dir="auto" className="text-sm whitespace-pre-line text-muted-foreground">
          {request.note}
        </p>
      ) : null}
    </FormPanel>
  )
}

export function SubjectRecords({ detail }: { detail: DataRequestDetail }) {
  const t = useTranslations("privacy.detail")
  const f = useFormat()
  const { member, account } = detail

  if (subjectGone(detail)) {
    return null
  }

  return (
    <FormPanel title={t("who")}>
      {member ? (
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium">
            {t("memberRecord", { name: isolate(preferredName(member)) })}
          </span>
          {member.memberships.length === 0 ? (
            <span className="text-muted-foreground">{t("noMemberships")}</span>
          ) : (
            <ul className="flex flex-col gap-0.5 text-muted-foreground">
              {member.memberships.map((membership) => {
                const group = groupOfMembership(membership)

                return (
                  <li key={`${group}-${membership.from}`}>
                    {membership.until
                      ? t("membershipEnded", {
                          group,
                          from: f.mediumDate(membership.from),
                          until: f.mediumDate(membership.until),
                        })
                      : t("membershipCurrent", { group, from: f.mediumDate(membership.from) })}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
      {account ? (
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("accountRecord", { name: isolate(account.name) })}</span>
          <span dir="ltr" className="text-start text-muted-foreground">
            {account.email}
          </span>
          {account.roles.length > 0 ? (
            <span className="text-muted-foreground">{f.list(account.roles)}</span>
          ) : null}
        </div>
      ) : null}
    </FormPanel>
  )
}
