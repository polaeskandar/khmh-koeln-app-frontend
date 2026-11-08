"use client"

import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Archive, Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import {
  countByTab,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableTabs,
  DataTableView,
  useDataTable,
} from "@/components/data-table/data-table"
import { PageBody, PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { ServiceSwatch } from "@/components/service-tag"
import { StatusBadge } from "@/components/status"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useFormat } from "@/i18n/format"
import { Link } from "@/i18n/navigation"
import { fold } from "@/lib/domain/names"
import { localDateOf } from "@/lib/domain/time"
import { routes } from "@/lib/routes"

import { type ServiceRow, servicesQuery } from "./api"

type Tab = "active" | "archived" | "all"

const TABS: Record<Tab, (row: ServiceRow) => boolean> = {
  active: (r) => !r.archived,
  archived: (r) => r.archived,
  all: () => true,
}

export function ServicesOverview() {
  const t = useTranslations()
  const query = useQuery(servicesQuery)

  return (
    <>
      <Topbar crumbs={[{ label: t("nav.services") }]} />
      <PageBody>
        <PageHeader title={t("nav.services")} description={t("services.description")} />
        <QueryState query={query}>{(list) => <ServicesTable rows={list.items} />}</QueryState>
      </PageBody>
    </>
  )
}

function ArchivedBadge({ row }: { row: ServiceRow }) {
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

export function ServicesTable({ rows }: { rows: ServiceRow[] }) {
  const t = useTranslations()
  const f = useFormat()
  const [tab, setTab] = useState<Tab>("active")
  const [search, setSearch] = useState("")
  const counts = countByTab(rows, TABS)

  const shown = useMemo(() => {
    const words = fold(search)

    return rows.filter(
      (r) =>
        TABS[tab](r) &&
        (words === "" ||
          fold(
            `${r.name} ${r.description ?? ""} ${r.stages.map((s) => s.name).join(" ")}`
          ).includes(words))
    )
  }, [rows, tab, search])

  const columns = useMemo<ColumnDef<ServiceRow, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("services.table.service")} />
        ),
        cell: ({ row: { original: r } }) => (
          <div className="flex min-w-0 items-start gap-3 py-1">
            <ServiceSwatch tone={r.tone} className="mt-1.5 size-2.5" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <Link
                  href={routes.service(r.id)}
                  className="font-medium hover:underline hover:underline-offset-4"
                >
                  {r.name}
                </Link>
                {r.archived ? <ArchivedBadge row={r} /> : null}
              </span>
              {r.description ? (
                <span
                  dir="auto"
                  className="block max-w-[46ch] truncate text-xs text-muted-foreground"
                >
                  {r.description}
                </span>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "stages",
        accessorFn: (r) => r.stages.length,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("services.table.stages")} />
        ),
        cell: ({ row: { original: r } }) =>
          r.stages.length === 0 ? (
            <span className="text-muted-foreground">{t("common.none")}</span>
          ) : (
            <span className="tabular-nums" title={r.stages.map((s) => s.name).join(f.separator)}>
              {r.stages.length}
            </span>
          ),
        size: 90,
      },
      {
        accessorKey: "memberCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("services.table.members")} />
        ),
        cell: ({ row: { original: r } }) => <span className="tabular-nums">{r.memberCount}</span>,
        size: 100,
      },
    ],
    [t, f]
  )

  const { table } = useDataTable({
    data: shown,
    columns,
    getRowId: (r) => r.id,
    initialSorting: [{ id: "name", desc: false }],
    pageSize: 50,
  })

  const empty = (
    <Empty className="py-6">
      <EmptyHeader>
        <EmptyTitle>
          {search
            ? t("services.table.noMatch", { query: search })
            : tab === "archived"
              ? t("services.table.noArchived")
              : t("services.table.none")}
        </EmptyTitle>
        <EmptyDescription>
          {search ? t("services.table.checkSpelling") : t("services.table.appearHere")}
        </EmptyDescription>
      </EmptyHeader>
      {search ? (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={() => setSearch("")}>
            {t("common.clearSearch")}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableTabs
          value={tab}
          onValueChange={setTab}
          tabs={(Object.keys(TABS) as Tab[]).map((value) => ({
            value,
            label: t(`services.table.tabs.${value}`, { count: counts[value] }),
          }))}
        />
        <InputGroup className="w-full sm:w-72">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label={t("services.table.search")}
            placeholder={t("services.table.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label={t("common.clearSearch")}
                onClick={() => setSearch("")}
              >
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
      </div>

      <ul className="flex flex-col divide-y border-y md:hidden" aria-label={t("nav.services")}>
        {shown.length === 0 ? (
          <li>{empty}</li>
        ) : (
          table.getRowModel().rows.map(({ original: r }) => (
            <li key={r.id}>
              <Link href={routes.service(r.id)} className="flex min-w-0 items-start gap-3 py-3">
                <ServiceSwatch tone={r.tone} className="mt-1.5 size-2.5" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex min-w-0 flex-wrap items-center gap-2 font-medium">
                    <span className="truncate">{r.name}</span>
                    {r.archived ? <ArchivedBadge row={r} /> : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("counts.stages", { count: r.stages.length })} ·{" "}
                    {t("counts.members", { count: r.memberCount })}
                  </span>
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>

      <DataTableView table={table} className="hidden md:block" emptyMessage={empty} />
      {table.getPageCount() > 1 ? <DataTablePagination table={table} /> : null}
    </div>
  )
}
