"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

import { Topbar } from "@/features/portals/staff/topbar"
import { NoAccess } from "@/components/no-access"
import { PageBody, PageHeader, Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { useCan } from "@/features/identity/auth/session"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

import { type DataRequestRow, dataRequestsQuery } from "./api"
import { RecordRequestButton } from "./record-request-dialog"
import { DueLabel, RequestStatusBadge, useSubjectLabel } from "./request-bits"

function ClosedCell({ row, today }: { row: DataRequestRow; today: string }) {
  const t = useTranslations("privacy.list")
  const f = useFormat()

  if (!row.closedAt) {
    return null
  }

  const when = f.atLabel(row.closedAt, today)

  return row.closedBy ? t("closedBy", { when, name: row.closedBy.name }) : when
}

function RequestsTable({
  rows,
  today,
  closed,
}: {
  rows: DataRequestRow[]
  today: string
  closed: boolean
}) {
  const t = useTranslations("privacy")
  const f = useFormat()
  const subject = useSubjectLabel()

  return (
    <div className="overflow-x-auto border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/40">
          <tr className="border-b text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <th scope="col" className="px-3 py-2 text-start">
              {t("list.subject")}
            </th>
            <th scope="col" className="px-3 py-2 text-start">
              {t("list.kind")}
            </th>
            <th scope="col" className="px-3 py-2 text-start">
              {t("list.received")}
            </th>
            <th scope="col" className="px-3 py-2 text-start">
              {closed ? t("list.closedOn") : t("list.due")}
            </th>
            <th scope="col" className="px-3 py-2 text-start">
              {t("list.status")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-b-0">
              <td className="px-3 py-3">
                <span className="flex flex-col gap-0.5">
                  <Link
                    href={routes.dataRequest(row.id)}
                    className="font-medium hover:underline hover:underline-offset-4"
                  >
                    <bdi>{subject(row)}</bdi>
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {t("list.requestedBy")}: <bdi>{row.requestedBy}</bdi>
                  </span>
                </span>
              </td>
              <td className="px-3 py-3">{t(`kind.${row.kind}`)}</td>
              <td className="px-3 py-3">
                <span className="flex flex-col gap-0.5">
                  {f.dayMonth(f.instantDate(row.receivedAt))}
                  <span className="text-xs text-muted-foreground">
                    {t(`channel.${row.channel}`)}
                  </span>
                </span>
              </td>
              <td className="px-3 py-3">
                {closed ? (
                  <ClosedCell row={row} today={today} />
                ) : (
                  <DueLabel dueOn={row.dueOn} today={today} />
                )}
              </td>
              <td className="px-3 py-3">
                <RequestStatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Requests() {
  const t = useTranslations()
  const query = useQuery(dataRequestsQuery)

  return (
    <QueryState query={query}>
      {(list) => (
        <>
          <PageHeader
            title={t("privacy.list.title")}
            description={t("privacy.list.description")}
            actions={<RecordRequestButton today={list.today} />}
          />
          <Section id="open" title={t("privacy.list.open", { count: list.open.length })}>
            {list.open.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("privacy.list.noneOpen")}</p>
            ) : (
              <RequestsTable rows={list.open} today={list.today} closed={false} />
            )}
          </Section>
          <Section
            id="closed"
            title={t("privacy.list.closed")}
            description={t("privacy.list.closedDescription")}
          >
            {list.closed.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("privacy.list.noneClosed")}</p>
            ) : (
              <RequestsTable rows={list.closed} today={list.today} closed />
            )}
          </Section>
          <p className="text-sm text-muted-foreground">
            {t.rich("privacy.list.notice", {
              link: (chunks) => (
                <Link href={routes.privacy()} className="underline underline-offset-4">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </>
      )}
    </QueryState>
  )
}

export function DataRequestsPage() {
  const t = useTranslations()
  const can = useCan()

  return (
    <>
      <Topbar
        crumbs={[
          { label: t("nav.settings"), href: routes.settings() },
          { label: t("privacy.list.title") },
        ]}
      />
      <PageBody>
        {can("update", "users") ? (
          <Requests />
        ) : (
          <NoAccess title={t("privacy.list.adminsOnly")}>
            {t("privacy.list.adminsOnlyHint")}
          </NoAccess>
        )}
      </PageBody>
    </>
  )
}

export function DataProtectionSummary() {
  const t = useTranslations("privacy.summary")

  return (
    <Section
      id="data-protection"
      title={t("title")}
      description={t("description")}
      actions={
        <Link href={routes.dataRequests()} className="text-sm underline underline-offset-4">
          {t("all")}
        </Link>
      }
    >
      {null}
    </Section>
  )
}
