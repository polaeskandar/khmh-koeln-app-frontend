"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarClock, Copy, Eraser, Link2, RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"
import { toast } from "sonner"

import { Topbar } from "@/components/app-shell/topbar"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { FormPanel } from "@/components/form-panel"
import { NoAccess } from "@/components/no-access"
import { PageBody, PageHeader, Section } from "@/components/page-header"
import { NotFoundState, QueryErrorState, QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useCan, useSession } from "@/features/identity/auth/session"
import { useSubmitOnce } from "@/hooks/use-submit-once"
import { useFormat } from "@/i18n/format"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { preferredName } from "@/lib/domain/names"
import { routes } from "@/lib/routes"

import {
  accountRecordOf,
  type CopyLink,
  type CopyLinkStatus,
  type Counts,
  createCopyLinkRequest,
  type DataRequestDetail,
  dataRequestQuery,
  eraseRequest,
  type ErasureReview,
  erasureReviewQuery,
  memberRecordOf,
  mentionLabelOf,
  DATA_REQUEST_QUERIES,
} from "./api"
import { DueLabel, RequestStatusBadge, useSubjectLabel } from "./request-bits"
import { DATA_REQUESTS_KEY } from "@/lib/api/query-keys"

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
            void queryClient.invalidateQueries({ queryKey: DATA_REQUESTS_KEY })

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

  if (request.status === "withdrawn" && request.closedAt) {
    return (
      <Section id="outcome" title={t("detail.outcome")}>
        <p className="text-sm">
          {t("detail.withdrawnOn", { when: f.atLabel(request.closedAt, data.today) })}
        </p>
      </Section>
    )
  }

  if (request.status !== "done" || !request.closedAt) {
    return null
  }

  const when = f.atLabel(request.closedAt, data.today)

  const closed =
    request.kind === "copy"
      ? request.closedBy
        ? t("detail.sentOn", { when })
        : t("detail.downloadedOn", { when })
      : !request.closedBy && request.erasesOn
        ? t("detail.erasedAutomatically", { when })
        : t("detail.erasedOn", { when })

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

function CopyLinkSection({ data }: { data: DataRequestDetail }) {
  const t = useTranslations()
  const queryClient = useQueryClient()
  const [created, setCreated] = useState<CopyLink | null>(null)
  const { request } = data
  const open = request.status === "open"
  const gone = data.member === null && data.account === null

  const create = useApiMutation(() => createCopyLinkRequest(request.id), {
    onSuccess: setCreated,
    invalidate: DATA_REQUEST_QUERIES,
  })

  const shown = created
    ? { expiresAt: created.expiresAt, emailedTo: created.emailedTo, usedAt: null }
    : data.copyLink

  const createLink = useSubmitOnce(async () => {
    const result = await create.execute()

    if (result.ok) {
      return true
    }

    if (result.problem.status !== 409) {
      return false
    }

    void queryClient.invalidateQueries({ queryKey: DATA_REQUESTS_KEY })

    return true
  })

  if (!open && !shown) {
    return null
  }

  const actions =
    !open || gone ? null : shown ? (
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
      description={open ? t("privacy.copyLink.description") : undefined}
      actions={actions}
    >
      {open && gone ? (
        <p className="border border-dashed p-4 text-sm text-muted-foreground">
          {t("errors.privacy.subjectGone")}
        </p>
      ) : null}
      {created ? <CreatedLink link={created} /> : null}
      {shown ? <LinkStatus status={shown} today={data.today} linkShown={created !== null} /> : null}
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
  const f = useFormat()
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
            {erasure && !blocked && review.data ? <Review review={review.data} /> : null}
            {erasure && !blocked && review.isError ? (
              <QueryErrorState error={review.error} onRetry={() => review.refetch()} />
            ) : null}
            {request.kind === "copy" ? <CopyLinkSection data={data} /> : null}
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
