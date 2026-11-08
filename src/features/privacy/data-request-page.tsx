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
import { NotFoundState, QueryState } from "@/components/page-states"
import { RecordPage } from "@/components/record-page"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useCan } from "@/features/auth/session"
import { useFormat } from "@/i18n/format"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { preferredName } from "@/lib/domain/names"
import { routes } from "@/lib/routes"

import {
  accountRecordOf,
  type DataRequestDetail,
  dataRequestQuery,
  type EraseCounts,
  eraseRequest,
  isMentionPlace,
  type KeepCounts,
  memberRecordOf,
} from "./api"
import { DueLabel, RequestStatusBadge, useSubjectLabel } from "./request-bits"

const ERASE_KEYS: (keyof EraseCounts)[] = [
  "person",
  "memberships",
  "attendance",
  "completions",
  "guardianLinks",
  "account",
  "roles",
]

const KEEP_KEYS: (keyof KeepCounts)[] = [
  "sessionTotals",
  "recordedMarks",
  "reportedCompletions",
  "lessons",
  "homework",
  "sessionHistory",
]

function useEraseLines() {
  const t = useTranslations("privacy.erase")

  return (counts: Partial<EraseCounts>) =>
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

function EraseAction({ data, name }: { data: DataRequestDetail; name: string }) {
  const t = useTranslations()
  const queryClient = useQueryClient()
  const eraseLines = useEraseLines()
  const [open, setOpen] = useState(false)
  const mentions = data.inventory?.mentions.length ?? 0
  const [clearNotes, setClearNotes] = useState(true)

  const erase = useApiMutation((clear: boolean) => eraseRequest(data.request.id, clear), {
    onSuccess: () => queryClient.invalidateQueries(),
  })

  return (
    <>
      <Button variant="destructive" disabled={!data.can.erase} onClick={() => setOpen(true)}>
        <Eraser data-icon="inline-start" />
        {t("privacy.actions.erase")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        tone="destructive"
        title={t("privacy.actions.eraseTitle", { name: isolate(name) })}
        description={t("privacy.actions.eraseDescription")}
        consequences={[...eraseLines(data.inventory?.erase ?? {}), t("privacy.actions.eraseKeeps")]}
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

function Review({ data }: { data: DataRequestDetail }) {
  const t = useTranslations("privacy.detail")
  const tm = useTranslations("privacy.mention")
  const tk = useTranslations("privacy.keep")
  const f = useFormat()
  const eraseLines = useEraseLines()
  const inventory = data.inventory

  if (!inventory) {
    return null
  }

  const keep = KEEP_KEYS.flatMap((key) =>
    inventory.keep[key] > 0 ? [tk(key, { count: inventory.keep[key] })] : []
  )

  return (
    <>
      <Section id="erases" title={t("erases")} description={t("erasesDescription")}>
        <Lines lines={eraseLines(inventory.erase)} />
      </Section>
      <Section id="keeps" title={t("keeps")} description={t("keepsDescription")}>
        <Lines lines={keep} />
      </Section>
      <Section
        id="mentions"
        title={t("mentions", { count: inventory.mentions.length })}
        description={t("mentionsDescription")}
      >
        {inventory.mentions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noMentions")}</p>
        ) : (
          <ul className="flex flex-col divide-y border-y">
            {inventory.mentions.map((mention) => (
              <li key={mention.id} className="flex flex-col gap-1 py-3 text-sm">
                <span className="text-xs text-muted-foreground">
                  {t("mentionWhere", {
                    where: isMentionPlace(mention.where) ? tm(mention.where) : mention.where,
                    group: mention.group ?? "",
                    date: mention.date ? f.mediumDate(mention.date) : "",
                  })}
                </span>
                <blockquote dir="auto" className="border-s-2 ps-3">
                  {mention.text}
                </blockquote>
              </li>
            ))}
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

function RequestView({ data }: { data: DataRequestDetail }) {
  const t = useTranslations()
  const subject = useSubjectLabel()
  const { request } = data
  const name = subject(request)
  const open = request.status === "open"

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
            open && request.kind === "erasure" ? <EraseAction data={data} name={name} /> : null
          }
        />
        {open && request.kind === "erasure" && !data.can.erase ? (
          <p className="border border-dashed p-4 text-sm text-muted-foreground">
            {t("privacy.detail.ownAccount")}
          </p>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="flex min-w-0 flex-col gap-8">
            {open && request.kind === "erasure" ? <Review data={data} /> : null}
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

  if (!can("delete", "users")) {
    return (
      <PageBody>
        <NoAccess title={t("adminsOnly")}>{t("adminsOnlyHint")}</NoAccess>
      </PageBody>
    )
  }

  return <RecordPage notFound={<NotFoundPage />}>{(id) => <Request id={id} />}</RecordPage>
}
