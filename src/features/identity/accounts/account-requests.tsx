"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { MemberAvatar } from "@/components/member-avatar"
import { Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { ServiceTag } from "@/components/service-tag"
import { StatusBadge } from "@/components/status"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { initialsOf } from "@/features/identity/auth/role-summary"
import { LOCALE_NAMES } from "@/i18n/config"
import { useFormat } from "@/i18n/format"
import { useRefetch } from "@/lib/api/refetch"
import type { LocalDate } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import {
  type AccountRequest,
  accountRequestsQuery,
  declineRequest,
  ACCOUNT_REQUEST_QUERIES,
} from "./api"

const KIND = { parent: "asParent", servant: "asServant", member: "asMember" } as const

function RequestRow({
  request,
  today,
  actions,
}: {
  request: AccountRequest
  today: LocalDate
  actions?: React.ReactNode
}) {
  const t = useTranslations("accountRequests")
  const f = useFormat()
  const { account } = request

  return (
    <li className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between">
      <div className="flex min-w-0 gap-3">
        <MemberAvatar
          name={account.displayName}
          initials={initialsOf(account.displayName)}
          seed={account.id}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{account.displayName}</span>
            {request.registeredAs ? (
              <StatusBadge tone="muted">{t(KIND[request.registeredAs])}</StatusBadge>
            ) : null}
            {request.services.map((service) => (
              <ServiceTag key={service.id} service={service} className="text-xs" />
            ))}
          </span>
          <span className="text-xs text-muted-foreground">
            <span dir="ltr">{account.email}</span> ·{" "}
            {t("registered", { when: f.atLabel(request.registeredAt, today) })} ·{" "}
            <span lang={account.language}>{LOCALE_NAMES[account.language]}</span>
          </span>
          {request.note ? (
            <blockquote dir="auto" className="border-s-2 ps-3 text-sm text-muted-foreground">
              {request.note}
            </blockquote>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 ps-11 md:ps-0">{actions}</div>
    </li>
  )
}

function DeclineButton({ request }: { request: AccountRequest }) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const refetch = useRefetch()

  const decline = useApiMutation(declineRequest, {
    successMessage: t("toast.accountDeclined", { name: request.account.displayName }),
    invalidate: ACCOUNT_REQUEST_QUERIES,
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      trigger={<Button variant="outline">{t("accountRequests.declineButton")}</Button>}
      title={t("accountRequests.decline.title", { name: request.account.displayName })}
      description={t("accountRequests.decline.description")}
      consequences={[t("accountRequests.decline.deleted"), t("accountRequests.decline.tell")]}
      confirmLabel={t("accountRequests.decline.confirm")}
      tone="destructive"
      onConfirm={async () => {
        const result = await decline.execute(request.account.id)

        if (!result.ok) {
          void refetch(ACCOUNT_REQUEST_QUERIES)
        }

        return true
      }}
    />
  )
}

export function AccountRequests({
  approve,
  decline = false,
}: {
  approve?: (request: AccountRequest, today: LocalDate) => React.ReactNode
  decline?: boolean
}) {
  const t = useTranslations("accountRequests")
  const query = useQuery(accountRequestsQuery)

  return (
    <Section
      id="account-requests"
      title={t("title", { count: query.data?.items.length ?? 0 })}
      description={t("description")}
    >
      <QueryState query={query}>
        {({ items, today }) =>
          items.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyDescription>{t("empty")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="divide-y border-y">
              {items.map((request) => (
                <RequestRow
                  key={request.account.id}
                  request={request}
                  today={today}
                  actions={
                    <>
                      {approve?.(request, today)}
                      {decline ? <DeclineButton request={request} /> : null}
                    </>
                  }
                />
              ))}
            </ul>
          )
        }
      </QueryState>
    </Section>
  )
}
