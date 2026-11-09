"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Eraser } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { FormPanel } from "@/components/form-panel"
import { NoAccess } from "@/components/no-access"
import { PageBody, PageHeader, Section } from "@/components/page-header"
import { NotFoundState, QueryErrorState, QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useCan, useSession } from "@/features/identity/auth/session"
import { useFormat } from "@/i18n/format"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { preferredName } from "@/lib/domain/names"
import { routes } from "@/lib/routes"

import {
  accountRecordOf,
  type Counts,
  type DataRequestDetail,
  dataRequestQuery,
  eraseRequest,
  type ErasureReview,
  erasureReviewQuery,
  memberRecordOf,
  mentionLabelOf,
} from "./api"
import { DueLabel, RequestStatusBadge, useSubjectLabel } from "./request-bits"

const ERASE_KEYS = [
  "person",
  "memberships",
  "attendance",
  "completions",
  "guardianLinks",
  "account",
  "roles",
] as const

const KEEP_KEYS = ["sessionTotals", "accountRows"] as const

function useEraseLines() {
  const t = useTranslations("privacy.erase")

  return (counts: Counts) =>
    ERASE_KEYS.flatMap((key) => {
      const count = counts[key] ?? 0

      return count > 0 ? [t(key, { count })] : []
    })
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1 ps-5 text-sm marker:text-muted-foreground">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}

function EraseAction({
  data,
  review,
  name,
}: {
  data: DataRequestDetail
  review: ErasureReview | undefined
  name: string
}) {
  const t = useTranslations()
  const queryClient = useQueryClient()
  const eraseLines = useEraseLines()
  const [open, setOpen] = useState(false)
  const mentions = review?.mentions.length ?? 0
  const [clearNotes, setClearNotes] = useState(true)

  const erase = useApiMutation((clear: boolean) => eraseRequest(data.request.id, clear), {
    onSuccess: () => queryClient.invalidateQueries(),
  })

  return (
    <>
      <Button variant="destructive" disabled={!review} onClick={() => setOpen(true)}>
        <Eraser data-icon="inline-start" />
        {t("privacy.actions.erase")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        tone="destructive"
        title={t("privacy.actions.eraseTitle", { name: isolate(name) })}
        description={t("privacy.actions.eraseDescription")}
        consequences={[...eraseLines(review?.erase ?? {}), t("privacy.actions.eraseKeeps")]}
        note={
          mentions > 0 ? (
            <label className="flex cursor-pointer items-center gap-2 text-foreground">
              <Checkbox
                checked={clearNotes}
                onCheckedChange={(checked) => setClearNotes(checked === true)}
              />
              {t("privacy.actions.clearNotes", { count: mentions })}
            </label>
          ) : undefined
        }
        confirmLabel={t("privacy.actions.eraseConfirm")}
        onConfirm={async () => {
          const result = await erase.execute(mentions > 0 && clearNotes)

          if (!result.ok && result.problem.status === 409) {
            void queryClient.invalidateQueries({ queryKey: ["data-requests"] })

            return true
          }

          return result.ok
        }}
      />
    </>
  )
}

function Review({ review }: { review: ErasureReview }) {
  const t = useTranslations("privacy.detail")
  const tm = useTranslations("privacy.mention")
  const tk = useTranslations("privacy.keep")
  const f = useFormat()
  const eraseLines = useEraseLines()

  const keep = KEEP_KEYS.flatMap((key) => {
    const count = review.keep[key] ?? 0

    return count > 0 ? [tk(key, { count })] : []
  })

  return (
    <>
      <Section id="erases" title={t("erases")} description={t("erasesDescription")}>
        <Lines lines={eraseLines(review.erase)} />
      </Section>
      <Section id="keeps" title={t("keeps")} description={t("keepsDescription")}>
        <Lines lines={keep} />
      </Section>
      <Section
        id="mentions"
        title={t("mentions", { count: review.mentions.length })}
        description={t("mentionsDescription")}
      >
        {review.mentions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noMentions")}</p>
        ) : (
          <ul className="flex flex-col divide-y border-y">
            {review.mentions.map((mention) => {
              const label = mentionLabelOf(mention.where)

              return (
                <li key={mention.id} className="flex flex-col gap-1 py-3 text-sm">
                  <span className="text-xs text-muted-foreground">
                    {t("mentionWhere", {
                      where: label ? tm(label) : mention.where,
                      group: mention.group ?? "",
                      date: mention.date ? f.mediumDate(mention.date) : "",
                    })}
                  </span>
                  <blockquote dir="auto" className="border-s-2 ps-3">
                    {mention.text}
                  </blockquote>
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </>
  )
}

function Outcome({ data }: { data: DataRequestDetail }) {
  const t = useTranslations("privacy")
  const f = useFormat()
  const eraseLines = useEraseLines()
  const { request } = data

  if (request.status !== "done" || !request.closedAt) {
    return null
  }

  const lines = request.outcome
    ? [
        ...eraseLines(request.outcome),
        ...(request.outcome.notes > 0 ? [t("erase.notes", { count: request.outcome.notes })] : []),
      ]
    : []

  return (
    <Section id="outcome" title={t("detail.outcome")}>
      <p className="text-sm">
        {request.kind === "erasure"
          ? t("detail.erasedOn", { when: f.atLabel(request.closedAt, data.today) })
          : t("detail.sentOn", { when: f.atLabel(request.closedAt, data.today) })}{" "}
        {request.closedBy ? t("detail.by", { name: request.closedBy.name }) : null}
      </p>
      {lines.length > 0 ? <Lines lines={lines} /> : null}
      {request.kind === "erasure" && !request.subjectName ? (
        <p className="text-sm text-muted-foreground">{t("detail.erasedNote")}</p>
      ) : null}
    </Section>
  )
}

function Subject({ data }: { data: DataRequestDetail }) {
  const t = useTranslations("privacy.detail")
  const f = useFormat()
  const member = data.member ? memberRecordOf(data.member) : null
  const account = data.account ? accountRecordOf(data.account) : null

  if (!member && !account) {
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
              {member.memberships.map((membership) => (
                <li key={`${membership.group}-${membership.from}`}>
                  {membership.until
                    ? t("membershipEnded", {
                        group: membership.group,
                        from: f.mediumDate(membership.from),
                        until: f.mediumDate(membership.until),
                      })
                    : t("membershipCurrent", {
                        group: membership.group,
                        from: f.mediumDate(membership.from),
                      })}
                </li>
              ))}
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

function useBlocked(data: DataRequestDetail) {
  const t = useTranslations()
  const { session } = useSession()
  const me = session.status === "authenticated" ? session.me.account.id : null

  if (data.account !== null && data.account.id === me) {
    return t("privacy.detail.ownAccount")
  }

  if (data.member === null && data.account === null) {
    return t("errors.privacy.subjectGone")
  }

  return null
}

function RequestView({ data }: { data: DataRequestDetail }) {
  const t = useTranslations()
  const subject = useSubjectLabel()
  const { request } = data
  const name = subject(request)
  const erasure = request.status === "open" && request.kind === "erasure"
  const blocked = useBlocked(data)
  const review = useQuery({ ...erasureReviewQuery(request.id), enabled: erasure && !blocked })

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
              <EraseAction data={data} review={blocked ? undefined : review.data} name={name} />
            ) : null
          }
        />
        {erasure && blocked ? (
          <p className="border border-dashed p-4 text-sm text-muted-foreground">{blocked}</p>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="flex min-w-0 flex-col gap-8">
            {erasure && !blocked && review.data ? <Review review={review.data} /> : null}
            {erasure && !blocked && review.isError ? (
              <QueryErrorState error={review.error} onRetry={() => review.refetch()} />
            ) : null}
            <Outcome data={data} />
          </div>
          <aside className="flex min-w-0 flex-col gap-6 lg:self-start">
            <Facts data={data} />
            <Subject data={data} />
          </aside>
        </div>
      </PageBody>
    </>
  )
}

function Facts({ data }: { data: DataRequestDetail }) {
  const t = useTranslations("privacy")
  const f = useFormat()
  const { request } = data

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
              <DueLabel dueOn={request.dueOn} today={data.today} />
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

function NotFoundPage() {
  const t = useTranslations("nav")

  return (
    <>
      <Topbar crumbs={[{ label: t("settings"), href: routes.settings() }]} />
      <NotFoundState home={routes.dataRequests()} />
    </>
  )
}

function Request({ id }: { id: string }) {
  const query = useQuery(dataRequestQuery(id))

  return (
    <QueryState query={query} notFound={<NotFoundPage />}>
      {(data) => <RequestView data={data} />}
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

  return <RecordPage notFound={<NotFoundPage />}>{(id) => <Request id={id} />}</RecordPage>
}
