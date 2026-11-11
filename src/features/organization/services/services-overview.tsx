"use client"

import { useCan, useUnassigned } from "@/features/identity/auth/session"
import { useQuery } from "@tanstack/react-query"
import { Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { type ReactNode, useMemo, useState } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import {
  countByTab,
  DataTablePagination,
  DataTableTabs,
  DataTableView,
  useDataTable,
} from "@/components/data-table/data-table"
import { NotAssigned } from "@/components/not-assigned"
import { PageBody, PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { ServiceSwatch } from "@/components/service-tag"
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
import { Link } from "@/i18n/navigation"
import { fold } from "@/lib/domain/names"
import { routes } from "@/lib/routes"

import { type ServiceRow, servicesQuery } from "./api"
import { useNextAt } from "./service-bits"
import { ArchivedBadge, useServiceColumns } from "./service-columns"
import { NewServiceButton, ServiceActionsMenu } from "./service-dialogs"

type Tab = "active" | "archived" | "all"

const TAB_ORDER: Tab[] = ["active", "archived", "all"]

const TABS: Record<Tab, (row: ServiceRow) => boolean> = {
  active: (r) => !r.archived,
  archived: (r) => r.archived,
  all: () => true,
}

export function ServicesOverview() {
  const t = useTranslations()
  const query = useQuery(servicesQuery)
  const can = useCan()
  const unassigned = useUnassigned()

  return (
    <>
      <Topbar crumbs={[{ label: t("nav.services") }]} />
      <PageBody>
        <PageHeader
          title={t("nav.services")}
          description={t("services.description")}
          actions={can("create", "services") ? <NewServiceButton /> : null}
        />
        {unassigned ? (
          <NotAssigned />
        ) : (
          <QueryState query={query}>{(list) => <ServicesTable rows={list.items} />}</QueryState>
        )}
      </PageBody>
    </>
  )
}

function ServicesToolbar({
  tab,
  onTabChange,
  counts,
  search,
  onSearchChange,
}: {
  tab: Tab
  onTabChange: (tab: Tab) => void
  counts: Record<Tab, number>
  search: string
  onSearchChange: (search: string) => void
}) {
  const t = useTranslations()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <DataTableTabs
        value={tab}
        onValueChange={onTabChange}
        tabs={TAB_ORDER.map((value) => ({
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
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label={t("common.clearSearch")}
              onClick={() => onSearchChange("")}
            >
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </div>
  )
}

function ServicesEmpty({
  search,
  tab,
  onClearSearch,
}: {
  search: string
  tab: Tab
  onClearSearch: () => void
}) {
  const t = useTranslations()

  return (
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
          <Button variant="outline" size="sm" onClick={onClearSearch}>
            {t("common.clearSearch")}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  )
}

function CompactServiceList({
  services,
  empty,
}: {
  services: ServiceRow[]
  empty: ReactNode | null
}) {
  const t = useTranslations()
  const nextAt = useNextAt()

  return (
    <ul className="flex flex-col divide-y border-y md:hidden" aria-label={t("nav.services")}>
      {empty ? (
        <li>{empty}</li>
      ) : (
        services.map((r) => (
          <li key={r.id} className="flex items-start gap-2">
            <Link
              href={routes.service(r.id)}
              className="flex min-w-0 flex-1 items-start gap-3 py-3"
            >
              <ServiceSwatch tone={r.tone} className="mt-1.5 size-2.5" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex min-w-0 flex-wrap items-center gap-2 font-medium">
                  <span className="truncate">{r.name}</span>
                  {r.archived ? <ArchivedBadge row={r} /> : null}
                </span>
                <span className="text-xs text-muted-foreground">
                  {[
                    t("counts.stages", { count: r.stages.length }),
                    t("counts.members", { count: r.memberCount }),
                    nextAt(r),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            </Link>
            <ServiceActionsMenu service={r} />
          </li>
        ))
      )}
    </ul>
  )
}

function matches(service: ServiceRow, words: string) {
  return fold(
    `${service.name} ${service.description ?? ""} ${service.stages.map((s) => s.name).join(" ")}`
  ).includes(words)
}

export function ServicesTable({ rows }: { rows: ServiceRow[] }) {
  const [tab, setTab] = useState<Tab>("active")
  const [search, setSearch] = useState("")
  const counts = countByTab(rows, TABS)
  const columns = useServiceColumns()

  const shown = useMemo(() => {
    const words = fold(search)

    return rows.filter((r) => TABS[tab](r) && (words === "" || matches(r, words)))
  }, [rows, tab, search])

  const { table } = useDataTable({
    data: shown,
    columns,
    getRowId: (r) => r.id,
    initialSorting: [{ id: "name", desc: false }],
    pageSize: 50,
  })

  const empty = <ServicesEmpty search={search} tab={tab} onClearSearch={() => setSearch("")} />

  return (
    <div className="flex flex-col gap-4">
      <ServicesToolbar
        tab={tab}
        onTabChange={setTab}
        counts={counts}
        search={search}
        onSearchChange={setSearch}
      />
      <CompactServiceList
        services={table.getRowModel().rows.map((row) => row.original)}
        empty={shown.length === 0 ? empty : null}
      />
      <DataTableView table={table} className="hidden md:block" emptyMessage={empty} />
      {table.getPageCount() > 1 ? <DataTablePagination table={table} /> : null}
    </div>
  )
}
