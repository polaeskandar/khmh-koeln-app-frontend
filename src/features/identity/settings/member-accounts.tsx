"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Unlink } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { MemberAvatar } from "@/components/member-avatar"
import { Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { StatusBadge } from "@/components/status"
import { Button } from "@/components/ui/button"
import { initialsOf } from "@/features/identity/role-summary"
import { useFormat } from "@/i18n/format"
import type { LocalDate } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"

import {
  type MemberAccount,
  memberAccountsQuery,
  unlinkMemberRequest,
} from "@/features/identity/settings/api"

const REFETCH = [["member-accounts"], ["accountRequests"]]

function AgeLine({ account }: { account: MemberAccount }) {
  const t = useTranslations("settings.members")

  if (account.ageCheck === "sixteenOrOlder") {
    return <>{t("sixteenOrOlder")}</>
  }

  if (account.ageCheck === "guardianConsent") {
    return account.guardianConsentNote ? (
      <span dir="auto">{t("guardianConsentNote", { note: account.guardianConsentNote })}</span>
    ) : (
      <>{t("guardianConsent")}</>
    )
  }

  return <>{t("linkedByOffice")}</>
}

function AccountRow({ account, today }: { account: MemberAccount; today: LocalDate }) {
  const t = useTranslations()
  const f = useFormat()
  const queryClient = useQueryClient()
  const [removing, setRemoving] = useState(false)

  const unlink = useApiMutation(unlinkMemberRequest, {
    successMessage: t("toast.memberUnlinked", { name: account.name }),
    invalidate: REFETCH,
  })

  const { member } = account
  const memberName = member.name ?? account.name

  const groups = member.inactive
    ? t("settings.members.inactive")
    : member.groups.length > 0
      ? member.groups.join(f.separator)
      : t("settings.members.noGroup")

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
      <span className="flex min-w-0 items-start gap-3">
        <MemberAvatar name={account.name} initials={initialsOf(account.name)} seed={account.id} />
        <span className="flex min-w-0 flex-col gap-0.5 text-sm">
          <span className="flex flex-wrap items-center gap-2">
            <bdi className="font-medium">{account.name}</bdi>
            {account.isParent ? (
              <StatusBadge tone="neutral">{t("settings.members.alsoParent")}</StatusBadge>
            ) : null}
            {account.disabled ? (
              <StatusBadge tone="muted">{t("settings.members.disabled")}</StatusBadge>
            ) : null}
          </span>
          <span dir="ltr" className="text-start text-xs text-muted-foreground">
            {account.email}
          </span>
          <span>
            {t.rich("settings.members.record", {
              name: memberName,
              strong: (chunks) => <bdi className="font-medium">{chunks}</bdi>,
            })}
            <span className="text-muted-foreground"> · {groups}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            <AgeLine account={account} />
            {account.approvedAt ? (
              <>
                {" · "}
                {account.approvedBy
                  ? t("settings.members.approvedBy", {
                      when: f.atLabel(account.approvedAt, today),
                      name: account.approvedBy.name,
                    })
                  : t("settings.members.approved", { when: f.atLabel(account.approvedAt, today) })}
              </>
            ) : null}
          </span>
        </span>
      </span>
      <Button variant="outline" size="sm" className="self-start" onClick={() => setRemoving(true)}>
        <Unlink data-icon="inline-start" />
        {t("settings.members.remove")}
      </Button>
      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={t("settings.members.removeTitle", { member: isolate(memberName) })}
        description={t("settings.members.removeDescription")}
        consequences={[t("settings.members.removeKept"), t("settings.members.removeAgain")]}
        confirmLabel={t("settings.members.removeConfirm")}
        tone="destructive"
        onConfirm={async () => {
          const result = await unlink.execute(account.id)

          if (!result.ok && result.problem.status === 409) {
            for (const queryKey of REFETCH) {
              void queryClient.invalidateQueries({ queryKey })
            }

            return true
          }

          return result.ok
        }}
      />
    </li>
  )
}

export function MemberAccounts() {
  const t = useTranslations("settings.members")
  const query = useQuery(memberAccountsQuery)

  return (
    <Section id="members" title={t("title")} description={t("description")}>
      <QueryState query={query}>
        {(data) =>
          data.items.length === 0 ? (
            <p className="border border-dashed p-5 text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul className="flex flex-col divide-y border-y">
              {data.items.map((account) => (
                <AccountRow key={account.id} account={account} today={data.today} />
              ))}
            </ul>
          )
        }
      </QueryState>
    </Section>
  )
}
