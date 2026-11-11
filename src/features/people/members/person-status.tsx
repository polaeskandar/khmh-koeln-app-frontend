"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { StatusBadge } from "@/components/status"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { preferredName } from "@/lib/domain/names"

import {
  deactivatePersonRequest,
  MEMBERSHIP_QUERIES,
  type PersonRow,
  reactivatePersonRequest,
} from "./api"

export function InactiveBadge() {
  const t = useTranslations("common")

  return (
    <StatusBadge tone="muted" className="shrink-0">
      {t("inactive")}
    </StatusBadge>
  )
}

export function StatusAction({
  row,
  onChange,
}: {
  row: PersonRow
  onChange: (row: PersonRow) => void
}) {
  const t = useTranslations()
  const [confirming, setConfirming] = useState(false)

  const changed = (next: PersonRow["person"]) =>
    onChange({
      ...row,
      person: next,
      placements: next.status === "inactive" ? [] : row.placements,
    })

  const deactivate = useApiMutation(deactivatePersonRequest, {
    successMessage: (next) => t("toast.personInactive", { name: preferredName(next) }),
    invalidate: MEMBERSHIP_QUERIES,
    awaitRefetch: true,
    onSuccess: changed,
  })

  const reactivate = useApiMutation(reactivatePersonRequest, {
    successMessage: (next) => t("toast.personReactivated", { name: preferredName(next) }),
    invalidate: MEMBERSHIP_QUERIES,
    awaitRefetch: true,
    onSuccess: changed,
  })

  if (row.person.status === "inactive") {
    return (
      <Button
        variant="outline"
        disabled={reactivate.pending}
        onClick={() => void reactivate.execute(row.person.id)}
      >
        {reactivate.pending ? <Spinner data-icon="inline-start" /> : null}
        {t("members.sheet.reactivate")}
      </Button>
    )
  }

  return (
    <>
      <Button variant="outline" onClick={() => setConfirming(true)}>
        {t("members.sheet.markInactive")}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("members.sheet.inactiveTitle", { name: isolate(preferredName(row.person)) })}
        description={t("members.sheet.inactiveDescription")}
        consequences={[
          t("members.sheet.inactiveConsequences.rosters"),
          t("members.sheet.inactiveConsequences.history"),
          t("members.sheet.inactiveConsequences.reactivate"),
        ]}
        confirmLabel={t("members.sheet.markInactive")}
        onConfirm={async () => (await deactivate.execute(row.person.id)).ok}
      />
    </>
  )
}
