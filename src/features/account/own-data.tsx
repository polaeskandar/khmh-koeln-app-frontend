"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Download, Hourglass, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { ReasonDialog } from "@/components/confirm-dialog"
import { FormPanel } from "@/components/form-panel"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useFormat } from "@/i18n/format"
import { api, apiDownload, dataOf, type Schemas } from "@/lib/api/client"
import type { LocalDate } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"

type ErasureRequest = Schemas["OwnErasureRequest"]

const erasureRequestQuery = {
  queryKey: ["me", "erasure-request"] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    dataOf(api.GET("/me/erasure-request", { signal })),
}

const requestErasure = (note: string | null) =>
  dataOf(api.POST("/me/erasure-request", { body: note ? { note } : {} }))

export function OwnData({ today }: { today: LocalDate }) {
  const t = useTranslations()
  const f = useFormat()
  const queryClient = useQueryClient()
  const erasure = useQuery(erasureRequestQuery)

  const download = useApiMutation(() =>
    apiDownload(api.GET("/me/personal-data", { parseAs: "blob" }), "khmk-my-data.json")
  )

  const ask = useApiMutation(requestErasure, {
    successMessage: t("toast.erasureRequested"),
    onSuccess: (requested) =>
      queryClient.setQueryData(erasureRequestQuery.queryKey, { erasureRequested: requested }),
  })

  const requested = erasure.data?.erasureRequested ?? null

  return (
    <FormPanel title={t("account.data")}>
      <p className="text-sm text-muted-foreground">{t("account.dataDescription")}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-prose flex-col gap-1 text-sm">
          <p className="font-medium">{t("privacy.own.copyTitle")}</p>
          <p className="text-muted-foreground">{t("privacy.own.copyText")}</p>
        </div>
        <Button
          variant="outline"
          className="shrink-0"
          disabled={download.pending}
          onClick={() => void download.execute()}
        >
          {download.pending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Download data-icon="inline-start" />
          )}
          {t("privacy.own.download")}
        </Button>
      </div>
      <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-prose flex-col gap-1 text-sm">
          <p className="font-medium">{t("privacy.own.deleteTitle")}</p>
          {requested ? (
            <p role="status" className="flex items-start gap-2 text-muted-foreground">
              <Hourglass className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
              {t("privacy.own.requested", {
                when: f.atLabel(requested.receivedAt, today),
                due: f.mediumDate(requested.dueOn),
              })}
            </p>
          ) : (
            <p className="text-muted-foreground">{t("privacy.own.deleteText")}</p>
          )}
        </div>
        {erasure.isError ? (
          <span className="flex shrink-0 flex-wrap items-center gap-2 text-sm text-destructive">
            {t("errors.loadFailed")}
            <Button variant="outline" onClick={() => erasure.refetch()}>
              {t("common.retry")}
            </Button>
          </span>
        ) : null}
        {erasure.data && !requested ? (
          <ReasonDialog
            trigger={
              <Button variant="outline" className="shrink-0">
                <Trash2 data-icon="inline-start" />
                {t("privacy.own.delete")}
              </Button>
            }
            title={t("privacy.own.confirmTitle")}
            description={t("privacy.own.confirmText")}
            reasonLabel={t("privacy.own.noteLabel")}
            reasonHint={t("privacy.own.noteHint")}
            confirmLabel={t("privacy.own.confirm")}
            tone="destructive"
            onConfirm={async (note) => {
              const result = await ask.execute(note)

              if (result.ok) {
                return true
              }

              if (result.problem.code !== "privacy.alreadyRequested") {
                return false
              }

              await queryClient.invalidateQueries({ queryKey: erasureRequestQuery.queryKey })

              return true
            }}
          />
        ) : null}
      </div>
    </FormPanel>
  )
}
