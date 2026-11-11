"use client"

import { Copy, Link2, RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Section } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { useFormat } from "@/i18n/format"
import { isStale, useRefetch } from "@/lib/api/refetch"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import {
  type CopyLink,
  type CopyLinkStatus,
  createCopyLinkRequest,
  type DataRequestDetail,
  subjectGone,
  DATA_REQUEST_QUERIES,
} from "./api"

function CreatedLink({ link }: { link: CopyLink }) {
  const t = useTranslations("privacy.copyLink")
  const id = useId()

  async function copy() {
    try {
      await navigator.clipboard.writeText(link.url)
      toast.success(t("copied"))
    } catch {
      toast.error(t("copyFailed"))
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={id}>{t("link")}</FieldLabel>
      <div className="flex gap-2">
        <Input
          id={id}
          readOnly
          dir="ltr"
          value={link.url}
          className="min-w-0 flex-1 font-mono text-xs"
          onFocus={(event) => event.currentTarget.select()}
        />
        <Button variant="outline" className="shrink-0" onClick={() => void copy()}>
          <Copy data-icon="inline-start" />
          {t("copy")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("shownOnce")}</p>
    </div>
  )
}

function LinkStatus({
  status,
  today,
  linkShown,
}: {
  status: CopyLinkStatus
  today: string
  linkShown: boolean
}) {
  const t = useTranslations("privacy.copyLink")
  const f = useFormat()
  const [now] = useState(Date.now)
  const expired = !status.usedAt && Date.parse(status.expiresAt) <= now

  return (
    <ul className="flex flex-col gap-1 text-sm">
      <li>
        {status.usedAt
          ? t("used", { when: f.atLabel(status.usedAt, today) })
          : expired
            ? t("expired", { when: f.atLabel(status.expiresAt, today) })
            : t("expires", {
                date: f.dayMonth(f.instantDate(status.expiresAt)),
                time: f.instantTime(status.expiresAt),
              })}
      </li>
      <li className="text-muted-foreground">
        {status.emailedTo
          ? t.rich("emailedTo", { email: () => <bdi dir="ltr">{status.emailedTo}</bdi> })
          : t("handOver")}
      </li>
      {linkShown ? null : <li className="text-muted-foreground">{t("hidden")}</li>}
    </ul>
  )
}

export function CopyLinkSection({ detail }: { detail: DataRequestDetail }) {
  const t = useTranslations()
  const refetch = useRefetch()
  const [created, setCreated] = useState<CopyLink | null>(null)
  const { request } = detail
  const requestOpen = request.status === "open"
  const gone = subjectGone(detail)

  const create = useApiMutation(() => createCopyLinkRequest(request.id), {
    onSuccess: setCreated,
    invalidate: DATA_REQUEST_QUERIES,
  })

  const shown = created
    ? { expiresAt: created.expiresAt, emailedTo: created.emailedTo, usedAt: null }
    : detail.copyLink

  const createLink = useSubmitOnce(async () => {
    const result = await create.execute()

    if (result.ok) {
      return true
    }

    if (!isStale(result.problem, [409])) {
      return false
    }

    void refetch(DATA_REQUEST_QUERIES)

    return true
  })

  if (!requestOpen && !shown) {
    return null
  }

  const actions =
    !requestOpen || gone ? null : shown ? (
      <ConfirmDialog
        trigger={
          <Button variant="outline">
            <RefreshCw data-icon="inline-start" />
            {t("privacy.copyLink.createNew")}
          </Button>
        }
        title={t("privacy.copyLink.newTitle")}
        description={t("privacy.copyLink.newText")}
        confirmLabel={t("privacy.copyLink.newConfirm")}
        onConfirm={async () => (await createLink()) ?? false}
      />
    ) : (
      <Button disabled={create.pending} onClick={() => void createLink()}>
        {create.pending ? <Spinner data-icon="inline-start" /> : <Link2 data-icon="inline-start" />}
        {t("privacy.copyLink.create")}
      </Button>
    )

  return (
    <Section
      id="copy-link"
      title={t("privacy.copyLink.title")}
      description={requestOpen ? t("privacy.copyLink.description") : undefined}
      actions={actions}
    >
      {requestOpen && gone ? (
        <p className="border border-dashed p-4 text-sm text-muted-foreground">
          {t("errors.privacy.subjectGone")}
        </p>
      ) : null}
      {created ? <CreatedLink link={created} /> : null}
      {shown ? (
        <LinkStatus status={shown} today={detail.today} linkShown={created !== null} />
      ) : null}
    </Section>
  )
}
