"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

import {
  type DataTableFeatures,
  DataTablePagination,
  DataTableView,
  useDataTable,
} from "@/components/data-table/data-table"
import { MemberAvatar } from "@/components/member-avatar"
import { ServiceSwatch } from "@/components/service-tag"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { useFormat } from "@/i18n/format"
import { isolate } from "@/lib/bidi"
import { fullName, initials, preferredName } from "@/lib/domain/names"

import type { PeopleList, PersonRow, Placement } from "./api"
import { InactiveBadge } from "./person-status"

const PAGE_SIZE = 25

const placementLabel = (p: Placement) =>
  p.stage ? `${p.stage.name} (${p.service.name})` : p.service.name

function PersonName({ row: { person } }: { row: PersonRow }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <MemberAvatar name={preferredName(person)} initials={initials(person)} seed={person.id} />
      <span className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium">{preferredName(person)}</span>
          {person.status === "inactive" ? <InactiveBadge /> : null}
        </span>
        {person.displayName ? (
          <span className="truncate text-xs text-muted-foreground">{fullName(person)}</span>
        ) : null}
      </span>
    </span>
  )
}

function BelongsTo({ row }: { row: PersonRow }) {
  const t = useTranslations("members")

  if (row.placements.length === 0) {
    return <span className="text-muted-foreground">{t("noService")}</span>
  }

  return (
    <span className="flex flex-col gap-0.5">
      {row.placements.map((placement) => (
        <span key={placement.membershipId} className="inline-flex items-center gap-1.5">
          <ServiceSwatch tone={placement.service.tone} />
          {placementLabel(placement)}
        </span>
      ))}
    </span>
  )
}

function EmptyPeople({
  searchText,
  filters,
  onClearSearch,
  onClearFilters,
}: {
  searchText: string
  filters: string[]
  onClearSearch: () => void
  onClearFilters: () => void
}) {
  const t = useTranslations()
  const f = useFormat()
  const named = filters.map(isolate).join(f.separator)

  const hint = searchText
    ? filters.length > 0
      ? t("members.empty.noMatchFilteredHint", { filters: named })
      : t("members.empty.noMatchHint")
    : filters.length > 0
      ? t("members.empty.filteredHint", { filters: named })
      : t("members.empty.hint")

  return (
    <Empty className="py-6">
      <EmptyHeader>
        <EmptyTitle>
          {searchText
            ? t("members.empty.noMatch", { query: searchText })
            : t("members.empty.title")}
        </EmptyTitle>
        <EmptyDescription>{hint}</EmptyDescription>
      </EmptyHeader>
      {searchText || filters.length > 0 ? (
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            {searchText ? (
              <Button variant="outline" size="sm" onClick={onClearSearch}>
                {t("common.clearSearch")}
              </Button>
            ) : null}
            {filters.length > 0 ? (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                {t("members.empty.clearFilters")}
              </Button>
            ) : null}
          </div>
        </EmptyContent>
      ) : null}
    </Empty>
  )
}

export function PeopleTable({
  list,
  searchText,
  filters,
  onPage,
  onClearSearch,
  onClearFilters,
  onSelect,
}: {
  list: PeopleList
  searchText: string
  filters: string[]
  onPage: (page: number) => void
  onClearSearch: () => void
  onClearFilters: () => void
  onSelect: (row: PersonRow) => void
}) {
  const t = useTranslations()
  const f = useFormat()

  const columns = useMemo<ColumnDef<DataTableFeatures, PersonRow, unknown>[]>(
    () => [
      {
        id: "name",
        header: () => t("members.name"),
        cell: ({ row: { original } }) => (
          <button type="button" className="min-w-0 text-start" onClick={() => onSelect(original)}>
            <PersonName row={original} />
          </button>
        ),
      },
      {
        id: "belongsTo",
        header: () => t("members.belongsTo"),
        cell: ({ row: { original } }) => <BelongsTo row={original} />,
      },
    ],
    [t, onSelect]
  )

  const { table } = useDataTable({
    data: list.items,
    columns,
    getRowId: (row) => row.person.id,
    pageSize: PAGE_SIZE,
    manual: { rowCount: list.total, page: list.page, onPageChange: onPage },
  })

  const empty = (
    <EmptyPeople
      searchText={searchText}
      filters={filters}
      onClearSearch={onClearSearch}
      onClearFilters={onClearFilters}
    />
  )

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y border-y md:hidden" aria-label={t("nav.members")}>
        {list.items.length === 0 ? (
          <li>{empty}</li>
        ) : (
          list.items.map((row) => (
            <li key={row.person.id}>
              <button
                type="button"
                className="flex w-full min-w-0 flex-col items-start gap-1 py-3 text-start"
                onClick={() => onSelect(row)}
              >
                <PersonName row={row} />
                <span className="ps-11 text-xs text-muted-foreground">
                  {row.placements.length === 0
                    ? t("members.noService")
                    : row.placements.map(placementLabel).join(f.separator)}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
      <DataTableView table={table} className="hidden md:block" emptyMessage={empty} />
      <DataTablePagination
        table={table}
        totalOverride={list.total}
        summary={({ start, end, total }) => t("members.showing", { start, end, total })}
      />
    </div>
  )
}
