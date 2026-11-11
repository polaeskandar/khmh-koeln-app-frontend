"use client"

import { useTranslations } from "next-intl"

import { Section } from "@/components/page-header"
import { useFormat } from "@/i18n/format"

import type { DataRequestDetail, DataRequestRow } from "./api"
import { Lines, useEraseLines } from "./erase-lines"

type PrivacyT = ReturnType<typeof useTranslations<"privacy">>

function closedText(t: PrivacyT, request: DataRequestRow, when: string) {
  if (request.kind === "copy") {
    return request.closedBy ? t("detail.sentOn", { when }) : t("detail.downloadedOn", { when })
  }

  return !request.closedBy && request.erasesOn
    ? t("detail.erasedAutomatically", { when })
    : t("detail.erasedOn", { when })
}

export function RequestOutcome({ detail }: { detail: DataRequestDetail }) {
  const t = useTranslations("privacy")
  const f = useFormat()
  const eraseLines = useEraseLines()
  const { request } = detail

  if (request.status === "withdrawn" && request.closedAt) {
    return (
      <Section id="outcome" title={t("detail.outcome")}>
        <p className="text-sm">
          {t("detail.withdrawnOn", { when: f.atLabel(request.closedAt, detail.today) })}
        </p>
      </Section>
    )
  }

  if (request.status !== "done" || !request.closedAt) {
    return null
  }

  const closed = closedText(t, request, f.atLabel(request.closedAt, detail.today))

  const lines = request.outcome
    ? [
        ...eraseLines(request.outcome),
        ...(request.outcome.notes > 0 ? [t("erase.notes", { count: request.outcome.notes })] : []),
      ]
    : []

  return (
    <Section id="outcome" title={t("detail.outcome")}>
      <p className="text-sm">
        {closed} {request.closedBy ? t("detail.by", { name: request.closedBy.name }) : null}
      </p>
      {lines.length > 0 ? <Lines lines={lines} /> : null}
      {request.kind === "erasure" && !request.subjectName ? (
        <p className="text-sm text-muted-foreground">{t("detail.erasedNote")}</p>
      ) : null}
    </Section>
  )
}
