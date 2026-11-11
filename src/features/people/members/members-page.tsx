"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Suspense } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import { NoAccess } from "@/components/no-access"
import { PageBody, PageHeader } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { RequirePermission } from "@/features/identity/auth/guards"
import { useCan } from "@/features/identity/auth/session"
import { servicesQuery } from "@/features/organization/services/api"
import { oneOf } from "@/lib/one-of"

import { peopleQuery } from "./api"
import { AddPersonButton } from "./add-person-dialog"
import { useGroupOptions } from "./groups"
import { PeopleTable } from "./people-table"
import { SelectedPersonSheet, useSelectedPerson } from "./selected-person-sheet"
import { STATUSES, useListView, usePaging, useSearchField } from "./use-list-view"

export function MembersScreen() {
  const t = useTranslations()
  const can = useCan()
  const [view, show] = useListView()
  const search = useSearchField(view.q, show)
  const services = useQuery(servicesQuery)
  const groups = useGroupOptions()
  const option = groups.find((candidate) => candidate.value === view.group)
  const group = option?.value ?? ""
  const ready = view.group === "" || !services.isPending
  const { q, status } = view
  const filterKey = `${q}|${group}|${status}`
  const [page, setPage] = usePaging(filterKey)
  const scope = { ...option?.filter, ...(q ? { q } : {}) }

  const people = useQuery({
    ...peopleQuery({ ...scope, status, page }),
    enabled: ready,
    placeholderData: keepPreviousData,
  })

  const active = useQuery({
    ...peopleQuery({ ...scope, status: "active", page: 1 }),
    enabled: ready,
    placeholderData: keepPreviousData,
  })

  const inactive = useQuery({
    ...peopleQuery({ ...scope, status: "inactive", page: 1 }),
    enabled: ready,
    placeholderData: keepPreviousData,
  })

  const selection = useSelectedPerson(filterKey, people.data?.items)

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
            value={search.text}
            onChange={(event) => search.setText(event.target.value)}
          />
          {search.text ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label={t("common.clearSearch")}
                onClick={search.clear}
              >
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
        <span className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {can("create", "members") ? <AddPersonButton /> : null}
          <NativeSelect
            aria-label={t("members.service")}
            className="w-full sm:w-64"
            value={group}
            onChange={(event) => show({ group: event.target.value }, "push")}
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
      <Tabs
        value={status}
        onValueChange={(value) => show({ status: oneOf(STATUSES, value) ?? status }, "push")}
      >
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
            searchText={q}
            filters={[
              ...(option ? [option.label] : []),
              ...(status === "inactive" ? [t("common.inactive")] : []),
            ]}
            onPage={setPage}
            onClearSearch={search.clear}
            onClearFilters={() => show({ group: "", status: "active" }, "push")}
            onSelect={selection.select}
          />
        )}
      </QueryState>
      {selection.open ? (
        <SelectedPersonSheet
          selected={selection.open}
          listed={selection.listed}
          onClose={selection.close}
          onStatusChange={selection.changeStatus}
        />
      ) : null}
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
          <Suspense>
            <MembersScreen />
          </Suspense>
        </RequirePermission>
      </PageBody>
    </>
  )
}
