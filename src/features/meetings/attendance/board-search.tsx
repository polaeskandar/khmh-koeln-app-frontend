"use client"

import { Search, X } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { oneOf } from "@/lib/one-of"

import type { AttendanceSheet, MarkReference } from "./api"
import { tallyOf } from "./board-counter"

export type Filter = "all" | "open" | "present"

const FILTERS: Filter[] = ["all", "open", "present"]

export const passesFilter = (filter: Filter, mark: MarkReference | null) =>
  filter === "all" || (filter === "present" ? mark !== null : mark === null)

export function BoardSearch({
  board,
  query,
  onQueryChange,
  filter,
  onFilterChange,
}: {
  board: AttendanceSheet
  query: string
  onQueryChange: (query: string) => void
  filter: Filter
  onFilterChange: (filter: Filter) => void
}) {
  const t = useTranslations("attendance.board")
  const tc = useTranslations("common")
  const { expected, rosterSize, notMarked } = tallyOf(board)

  return (
    <div className="sticky top-14 z-10 -mx-4 flex flex-col gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
      <InputGroup>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          aria-label={t("find")}
          placeholder={expected ? t("findOnRoster") : t("find")}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        {query ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label={tc("clearSearch")}
              onClick={() => onQueryChange("")}
            >
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
      {expected ? (
        <Tabs
          value={filter}
          onValueChange={(value) => onFilterChange(oneOf(FILTERS, value) ?? filter)}
        >
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all">{t("tabAll", { count: rosterSize })}</TabsTrigger>
            <TabsTrigger value="open">{t("tabOpen", { count: notMarked })}</TabsTrigger>
            <TabsTrigger value="present">
              {t("tabPresent", { count: board.counts.rosterPresent })}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}
    </div>
  )
}
