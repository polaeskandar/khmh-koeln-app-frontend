"use client"

import * as React from "react"
import {
  type Column,
  type ColumnDef,
  columnSizingFeature,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  type ReactTable,
  type RowData,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  type SortingState,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { oneOf } from "@/lib/one-of"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const dataTableFeatures = tableFeatures({
  columnSizingFeature,
  rowPaginationFeature,
  rowSortingFeature,
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
})

export type DataTableFeatures = typeof dataTableFeatures

const WIDTH_FROM_CONTENT = { size: undefined }

type UseDataTableOptions<TData extends RowData> = {
  data: TData[]
  columns: ColumnDef<DataTableFeatures, TData, unknown>[]
  getRowId?: (row: TData) => string
  initialSorting?: SortingState
  pageSize?: number
  manual?: { rowCount: number; page: number; onPageChange: (page: number) => void }
}

export function useDataTable<TData extends RowData>(options: UseDataTableOptions<TData>) {
  const { data, columns, getRowId, initialSorting = [], pageSize = 10, manual } = options

  const [sorting, setSorting] = React.useState<SortingState>(initialSorting)

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    getRowId,
    defaultColumn: WIDTH_FROM_CONTENT,
    state: {
      sorting,
      ...(manual ? { pagination: { pageIndex: manual.page - 1, pageSize } } : {}),
    },
    initialState: { pagination: { pageIndex: 0, pageSize } },
    ...(manual
      ? {
          manualPagination: true,
          manualSorting: true,
          rowCount: manual.rowCount,
          onPaginationChange: (updater) => {
            const current = { pageIndex: manual.page - 1, pageSize }
            const next = typeof updater === "function" ? updater(current) : updater
            manual.onPageChange(next.pageIndex + 1)
          },
        }
      : {}),
    onSortingChange: setSorting,
  })

  return { table }
}

type Sorted = false | "asc" | "desc"

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const

const ariaSortOf = (sorted: Sorted) => (sorted ? ARIA_SORT[sorted] : undefined)

function SortIcon({ sorted }: { sorted: Sorted }) {
  if (sorted === "desc") {
    return <ArrowDown className="size-3.5" />
  }

  if (sorted === "asc") {
    return <ArrowUp className="size-3.5" />
  }

  return <ChevronsUpDown className="size-3.5 opacity-50" />
}

export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<DataTableFeatures, TData, TValue>
  title: string
  className?: string
}) {
  const t = useTranslations("table")

  if (!column.getCanSort()) {
    return <span className={cn("flex h-8 items-center", className)}>{title}</span>
  }

  const sorted = column.getIsSorted()

  return (
    <button
      type="button"
      className={cn(
        "-mx-1 inline-flex h-8 items-center gap-1.5 px-1 uppercase hover:text-foreground",
        className
      )}
      onClick={() => column.toggleSorting(sorted === "asc")}
      aria-label={t("sortBy", { column: title })}
    >
      {title}
      <SortIcon sorted={sorted} />
    </button>
  )
}

export function DataTablePagination<TData extends RowData>({
  table,
  summary,
  totalOverride,
}: {
  table: ReactTable<DataTableFeatures, TData>
  summary?: (range: { start: number; end: number; total: number }) => string
  totalOverride?: number
}) {
  const t = useTranslations("table")
  const { pageIndex, pageSize } = table.state.pagination
  const rows = table.getRowCount()
  const total = totalOverride ?? rows
  const start = rows === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, rows)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex items-center justify-between gap-4 pt-3 text-sm text-muted-foreground">
      <span className="tabular-nums">
        {rows === 0
          ? t("noResults")
          : (summary?.({ start, end, total }) ?? t("showing", { start, end, total }))}
      </span>
      <div className="flex items-center gap-3">
        <span className="tabular-nums">{t("page", { page: pageIndex + 1, count: pageCount })}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={pageIndex === 0}
            aria-label={t("previous")}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={pageIndex + 1 >= pageCount}
            aria-label={t("next")}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function DataTableView<TData extends RowData>({
  table,
  className,
  emptyMessage,
}: {
  table: ReactTable<DataTableFeatures, TData>
  className?: string
  emptyMessage?: ReactNode
}) {
  const t = useTranslations("table")
  const columnCount = table.getAllLeafColumns().length

  return (
    <div className={cn("overflow-hidden border", className)}>
      <Table>
        <TableHeader className="bg-muted/40">
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  aria-sort={ariaSortOf(header.column.getIsSorted())}
                  style={{ width: header.column.columnDef.size }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                {emptyMessage ?? t("noResults")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function countByTab<TData, V extends string>(
  rows: TData[],
  tabs: Record<V, (row: TData) => boolean>
): Record<V, number> {
  const entries = Object.entries(tabs) as [V, (row: TData) => boolean][]

  return Object.fromEntries(entries.map(([tab, has]) => [tab, rows.filter(has).length])) as Record<
    V,
    number
  >
}

export function DataTableTabs<V extends string>({
  value,
  onValueChange,
  tabs,
}: {
  value: V
  onValueChange: (value: V) => void
  tabs: { value: V; label: string }[]
}) {
  const values = tabs.map((tab) => tab.value)

  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(oneOf(values, next) ?? value)}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
