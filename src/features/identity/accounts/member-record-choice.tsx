"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"

import { QueryErrorState } from "@/components/page-states"
import { Button } from "@/components/ui/button"
import { FieldDescription, FieldError, FieldLegend, FieldSet } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { groupsText, ignoreEnter } from "@/features/people/members/person-search"
import { useDebounced } from "@/hooks/use-debounced"
import { useFormat } from "@/i18n/format"
import type { Uuid } from "@/lib/api/types/common"
import { isolate } from "@/lib/bidi"
import { fold, fullName, preferredName } from "@/lib/domain/names"

import { type MemberCandidate, memberCandidatesQuery } from "./api"

function chosenRecordOf(
  picked: Uuid | undefined,
  candidates: MemberCandidate[],
  free: MemberCandidate[]
): Uuid | null {
  if (picked === undefined) {
    const [only, ...others] = free

    return only && others.length === 0 ? only.id : null
  }

  return candidates.some((person) => person.id === picked) ? picked : null
}

export function useMemberRecord(name: string) {
  const [text, setText] = useState(name)
  const q = useDebounced(text.trim(), 250)
  const candidates = useQuery({ ...memberCandidatesQuery(q), enabled: q.length >= 2 })
  const [picked, setPicked] = useState<Uuid | undefined>(undefined)
  const items = candidates.data?.items ?? []
  const namesakes = items.filter((person) => fold(fullName(person)) === fold(name))
  const free = namesakes.filter((person) => !person.hasAccount)

  return {
    text,
    q,
    candidates,
    items,
    namesakes,
    personId: chosenRecordOf(picked, items, free),
    search: setText,
    pick: setPicked,
  }
}

export function MemberRecordChoice({
  name,
  record,
  error,
  onAddNew,
}: {
  name: string
  record: ReturnType<typeof useMemberRecord>
  error?: string
  onAddNew: () => void
}) {
  const t = useTranslations()
  const f = useFormat()
  const id = useId()
  const { q, candidates, items } = record

  function candidateList() {
    if (q.length < 2) {
      return (
        <p className="text-xs text-muted-foreground">{t("accountRequests.approve.searchMember")}</p>
      )
    }

    if (candidates.isError) {
      return <QueryErrorState error={candidates.error} onRetry={() => candidates.refetch()} />
    }

    if (candidates.data && items.length === 0) {
      return (
        <p className="text-xs text-muted-foreground">
          {t("accountRequests.approve.noMemberMatches")}
        </p>
      )
    }

    return (
      <RadioGroup
        value={record.personId ?? ""}
        onValueChange={record.pick}
        className="flex flex-col gap-0 divide-y border-y"
      >
        {items.map((person) => (
          <label
            key={person.id}
            htmlFor={`${id}-${person.id}`}
            className={cn(
              "flex items-start gap-3 py-2.5 text-sm",
              person.hasAccount ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            )}
          >
            <RadioGroupItem
              id={`${id}-${person.id}`}
              value={person.id}
              disabled={person.hasAccount}
              className="mt-0.5"
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium">
                <bdi>{preferredName(person)}</bdi>
              </span>
              <span className="text-xs text-muted-foreground">
                {person.hasAccount
                  ? t("accountRequests.approve.hasAccount")
                  : groupsText(person, f.separator, t("accountRequests.approve.noGroup"))}
              </span>
            </span>
          </label>
        ))}
      </RadioGroup>
    )
  }

  return (
    <FieldSet data-invalid={error ? true : undefined}>
      <FieldLegend variant="label">{t("accountRequests.approve.memberRecord")}</FieldLegend>
      <FieldDescription>
        {t("accountRequests.approve.memberRecordHint", { name: isolate(name) })}
      </FieldDescription>
      <InputGroup>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          aria-label={t("accountRequests.approve.findMember")}
          placeholder={t("accountRequests.approve.findMember")}
          value={record.text}
          onChange={(event) => record.search(event.target.value)}
          onKeyDown={ignoreEnter}
        />
      </InputGroup>
      {record.namesakes.length > 1 ? (
        <p role="status" className="text-sm text-warning">
          {t("accountRequests.approve.sameName", {
            count: record.namesakes.length,
            name: isolate(name),
          })}
        </p>
      ) : null}
      {candidateList()}
      <Button type="button" variant="link" className="h-auto self-start p-0" onClick={onAddNew}>
        {t("accountRequests.approve.addNew", { name: isolate(name) })}
      </Button>
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldSet>
  )
}
