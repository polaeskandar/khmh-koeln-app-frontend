"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Archive } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { DataTableColumnHeader, type DataTableFeatures } from "@/components/data-table/data-table"
import { ServiceSwatch } from "@/components/service-tag"
import { StatusBadge } from "@/components/status"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import { localDateOf } from "@/lib/domain/time"
import { routes } from "@/lib/routes"

import { type Service, useServiceInsights } from "./api"
import { AttendanceCell, NextMeetingCell } from "./service-cells"
import { ServiceActionsMenu } from "./service-actions"

export function ArchivedBadge({ row }: { row: Service }) {
  const t = useTranslations()
  const f = useFormat()

  return (
    <StatusBadge
      tone="muted"
      icon={Archive}
      title={
        row.archivedAt
          ? t("services.table.archivedOn", { date: f.mediumDate(localDateOf(row.archivedAt)) })
          : undefined
      }
    >
      {t("common.archived")}
    </StatusBadge>
  )
}

function ServiceNameCell({ service }: { service: Service }) {
  return (
    <div className="flex min-w-0 items-start gap-3 py-1">
      <ServiceSwatch tone={service.tone} className="mt-1.5 size-2.5" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <Link
            href={routes.service(service.id)}
            className="font-medium hover:underline hover:underline-offset-4"
          >
            {service.name}
          </Link>
          {service.archived ? <ArchivedBadge row={service} /> : null}
        </span>
        {service.description ? (
          <span dir="auto" className="block max-w-[46ch] truncate text-xs text-muted-foreground">
            {service.description}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function StageCountCell({ service }: { service: Service }) {
  const t = useTranslations()
  const f = useFormat()

  if (service.stages.length === 0) {
    return <span className="text-muted-foreground">{t("common.none")}</span>
  }

  return (
    <span className="tabular-nums" title={service.stages.map((s) => s.name).join(f.separator)}>
      {service.stages.length}
    </span>
  )
}

export function useServiceColumns() {
  const t = useTranslations("services.table")
  const insights = useServiceInsights()

  return useMemo<ColumnDef<DataTableFeatures, Service, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("service")} />,
        cell: ({ row: { original: r } }) => <ServiceNameCell service={r} />,
      },
      {
        id: "stages",
        accessorFn: (r) => r.stages.length,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("stages")} />,
        cell: ({ row: { original: r } }) => <StageCountCell service={r} />,
        size: 90,
      },
      {
        accessorKey: "memberCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("members")} />,
        cell: ({ row: { original: r } }) => <span className="tabular-nums">{r.memberCount}</span>,
        size: 100,
      },
      {
        id: "next",
        accessorFn: (r) => {
          const next = insights.get(r.id)?.next

          return next ? `${next.date}T${next.startTime}` : "9999"
        },
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("next")} />,
        cell: ({ row: { original: r } }) => <NextMeetingCell service={r} />,
        size: 150,
      },
      {
        id: "attendance",
        accessorFn: (r) => insights.get(r.id)?.trend.rate ?? -1,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("attendance")} />,
        cell: ({ row: { original: r } }) => <AttendanceCell service={r} />,
        size: 130,
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row: { original: r } }) => <ServiceActionsMenu service={r} />,
        enableSorting: false,
        size: 48,
      },
    ],
    [t, insights]
  )
}
