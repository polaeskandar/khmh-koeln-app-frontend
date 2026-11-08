"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import {
  DataTablePagination,
  DataTableView,
  useDataTable,
} from "@/components/data-table/data-table"
import { MemberAvatar } from "@/components/member-avatar"
import { NoAccess } from "@/components/no-access"
import { PageBody, PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { RequirePermission } from "@/features/identity/guards"
import { useFormat } from "@/i18n/format"
import { fullName, initials, preferredName } from "@/lib/domain/names"

import {
  type PeopleList,
  peopleQuery,
  type PersonRow,
  type Placement,
} from "@/features/people/members/api"
import { AddPersonButton } from "@/features/people/members/add-person-dialog"
import { useGroupOptions } from "@/features/people/members/groups"
import { InactiveBadge, PersonSheet } from "@/features/people/members/person-sheet"

const PAGE_SIZE = 25
const SEARCH_DELAY_MS = 300

const placementLabel = (p: Placement) =>
  p.stage ? `${p.stage.name} (${p.service.name})` : p.service.name

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms)

    return () => clearTimeout(timer)
  }, [value, ms])

  return debounced
}

function PersonName({ person: { person } }: { person: PersonRow }) {
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

function BelongsTo({ person }: { person: PersonRow }) {
  const t = useTranslations("members")

  if (person.placements.length === 0) {
    return <span className="text-muted-foreground">{t("noService")}</span>
  }

  return (
    <span className="flex flex-col gap-0.5">
      {person.placements.map((placement) => (
        <span key={placement.membershipId} className="inline-flex items-center gap-1.5">
          <ServiceSwatch tone={placement.service.tone} />
          {placementLabel(placement)}
        </span>
      ))}
    </span>
  )
}

function PeopleTable({
  list,
  query,
  onPage,
  onClear,
  onSelect,
}: {
  list: PeopleList
  query: string
  onPage: (page: number) => void
  onClear: () => void
  onSelect?: (person: PersonRow) => void
}) {
  const t = useTranslations()
  const f = useFormat()

  const columns = useMemo<ColumnDef<PersonRow, unknown>[]>(
    () => [
      {
        id: "name",
        header: () => t("members.name"),
        cell: ({ row: { original } }) => (
          <button type="button" className="min-w-0 text-start" onClick={() => onSelect?.(original)}>
            <PersonName person={original} />
          </button>
        ),
      },
      {
        id: "belongsTo",
        header: () => t("members.belongsTo"),
        cell: ({ row: { original } }) => <BelongsTo person={original} />,
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
    <Empty className="py-6">
      <EmptyHeader>
        <EmptyTitle>
          {query ? t("members.empty.noMatch", { query }) : t("members.empty.title")}
        </EmptyTitle>
        <EmptyDescription>
          {query ? t("members.empty.noMatchHint") : t("members.empty.hint")}
        </EmptyDescription>
      </EmptyHeader>
      {query ? (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onClear}>
            {t("common.clearSearch")}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  )

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y border-y md:hidden" aria-label={t("nav.members")}>
        {list.items.length === 0 ? (
          <li>{empty}</li>
        ) : (
          list.items.map((person) => (
            <li key={person.person.id}>
              <button
                type="button"
                className="flex w-full min-w-0 flex-col items-start gap-1 py-3 text-start"
                onClick={() => onSelect?.(person)}
              >
                <PersonName person={person} />
                <span className="ps-11 text-xs text-muted-foreground">
                  {person.placements.length === 0
                    ? t("members.noService")
                    : person.placements.map(placementLabel).join(f.separator)}
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

type Status = "active" | "inactive" | "all"

export function MembersScreen() {
  const t = useTranslations()
  const [selected, setSelected] = useState<{ id: string; key: string } | null>(null)
  const groups = useGroupOptions()
  const [search, setSearch] = useState("")
  const [group, setGroup] = useState("")
  const q = useDebounced(search.trim(), SEARCH_DELAY_MS)
  const [status, setStatus] = useState<Status>("active")
  const filterKey = `${q}|${group}|${status}`
  const [paging, setPaging] = useState({ key: filterKey, page: 1 })

  if (paging.key !== filterKey) {
    setPaging({ key: filterKey, page: 1 })
  }

  const page = paging.key === filterKey ? paging.page : 1
  const setPage = (next: number) => setPaging({ key: filterKey, page: next })
  const filter = groups.find((option) => option.value === group)?.filter ?? {}
  const scope = { ...filter, ...(q ? { q } : {}) }

  const people = useQuery({
    ...peopleQuery({ ...scope, status, page }),
    placeholderData: keepPreviousData,
  })

  const active = useQuery({
    ...peopleQuery({ ...scope, status: "active", page: 1 }),
    placeholderData: keepPreviousData,
  })

  const inactive = useQuery({
    ...peopleQuery({ ...scope, status: "inactive", page: 1 }),
    placeholderData: keepPreviousData,
  })

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <InputGroup className="w-full sm:w-72">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label={t("members.search")}
            placeholder={t("members.searchPlaceholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
        <span className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {people.data?.can.add ? <AddPersonButton /> : null}
          <NativeSelect
            aria-label={t("members.service")}
            className="w-full sm:w-64"
            value={group}
            onChange={(event) => setGroup(event.target.value)}
          >
            <NativeSelectOption value="">{t("members.allServices")}</NativeSelectOption>
            {groups.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </span>
      </div>
      <Tabs value={status} onValueChange={(value) => setStatus(value as Status)}>
        <TabsList>
          <TabsTrigger value="active">
            {t("members.tabs.active", { count: active.data?.total ?? 0 })}
          </TabsTrigger>
          <TabsTrigger value="inactive">
            {t("members.tabs.inactive", { count: inactive.data?.total ?? 0 })}
          </TabsTrigger>
          <TabsTrigger value="all">{t("members.tabs.all")}</TabsTrigger>
        </TabsList>
      </Tabs>
      <QueryState query={people}>
        {(list) => (
          <PeopleTable
            list={list}
            query={q}
            onPage={setPage}
            onClear={() => setSearch("")}
            onSelect={(row) => setSelected({ id: row.person.id, key: filterKey })}
          />
        )}
      </QueryState>
      <PersonSheet
        person={
          selected?.key === filterKey
            ? (people.data?.items.find((row) => row.person.id === selected.id) ?? null)
            : null
        }
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}

export function MembersPage() {
  const t = useTranslations()

  return (
    <>
      <Topbar crumbs={[{ label: t("nav.members") }]} />
      <PageBody>
        <PageHeader title={t("nav.members")} description={t("members.description")} />
        <RequirePermission
          action="read"
          resource="members"
          fallback={<NoAccess title={t("members.noAccess")}>{t("members.noAccessHint")}</NoAccess>}
        >
          <MembersScreen />
        </RequirePermission>
      </PageBody>
    </>
  )
}
