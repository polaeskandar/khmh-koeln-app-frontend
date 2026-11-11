"use client"

import { useQuery } from "@tanstack/react-query"
import { CalendarClock } from "lucide-react"
import { useTranslations } from "next-intl"

import { RecordNotFound } from "@/features/portals/staff/record-not-found"
import { Topbar } from "@/features/portals/staff/topbar"
import { NoAccess } from "@/components/no-access"
import { PageBody, PageHeader } from "@/components/page-header"
import { QueryErrorState, QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { useCan } from "@/features/identity/auth/session"
import { useFormat } from "@/i18n/format"
import { isolate } from "@/lib/bidi"
import { routes } from "@/lib/routes"

import { type DataRequestDetail, dataRequestQuery, erasureReviewQuery } from "./api"
import { CopyLinkSection } from "./copy-link-section"
import { EraseAction, useEraseBlockReason } from "./erase-action"
import { ErasureReviewSections } from "./erasure-review"
import { RequestStatusBadge, useSubjectLabel } from "./request-labels"
import { RequestOutcome } from "./request-outcome"
import { RequestFacts, SubjectRecords } from "./request-panels"

function RequestView({ detail }: { detail: DataRequestDetail }) {
  const t = useTranslations()
  const f = useFormat()
  const subject = useSubjectLabel()
  const { request } = detail
  const name = subject(request)
  const erasure = request.status === "open" && request.kind === "erasure"
  const blocked = useEraseBlockReason(detail)
  const reviewing = erasure && !blocked
  const review = useQuery({ ...erasureReviewQuery(request.id), enabled: reviewing })

  return (
    <>
      <Topbar
        crumbs={[
          { label: t("nav.settings"), href: routes.settings() },
          { label: t("privacy.list.title"), href: routes.dataRequests() },
          { label: request.subjectName ?? t("privacy.list.erasedCrumb") },
        ]}
      />
      <PageBody>
        <PageHeader
          meta={
            <>
              <RequestStatusBadge status={request.status} />
              <span className="text-muted-foreground">{t(`privacy.kind.${request.kind}`)}</span>
            </>
          }
          title={name}
          description={t("privacy.detail.requestedBy", { name: isolate(request.requestedBy) })}
          actions={
            erasure ? (
              <EraseAction
                detail={detail}
                review={reviewing ? review.data : undefined}
                name={name}
              />
            ) : null
          }
        />
        {erasure && request.erasesOn ? (
          <p className="flex items-start gap-2 border p-4 text-sm">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
            {t("privacy.detail.erasesOn", { date: f.longDate(request.erasesOn) })}
          </p>
        ) : null}
        {erasure && blocked ? (
          <p className="border border-dashed p-4 text-sm text-muted-foreground">{blocked}</p>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="flex min-w-0 flex-col gap-8">
            {reviewing && review.data ? <ErasureReviewSections review={review.data} /> : null}
            {reviewing && review.isError ? (
              <QueryErrorState error={review.error} onRetry={() => review.refetch()} />
            ) : null}
            {request.kind === "copy" ? <CopyLinkSection detail={detail} /> : null}
            <RequestOutcome detail={detail} />
          </div>
          <aside className="flex min-w-0 flex-col gap-6 lg:self-start">
            <RequestFacts detail={detail} />
            <SubjectRecords detail={detail} />
          </aside>
        </div>
      </PageBody>
    </>
  )
}

function LoadedRequest({ id }: { id: string }) {
  const query = useQuery(dataRequestQuery(id))

  return (
    <QueryState
      query={query}
      notFound={<RecordNotFound area="settings" home={routes.dataRequests()} />}
    >
      {(detail) => <RequestView detail={detail} />}
    </QueryState>
  )
}

export function DataRequestPage() {
  const t = useTranslations("privacy.list")
  const can = useCan()

  if (!can("update", "users")) {
    return (
      <PageBody>
        <NoAccess title={t("adminsOnly")}>{t("adminsOnlyHint")}</NoAccess>
      </PageBody>
    )
  }

  return (
    <RecordPage notFound={<RecordNotFound area="settings" home={routes.dataRequests()} />}>
      {(id) => <LoadedRequest id={id} />}
    </RecordPage>
  )
}
