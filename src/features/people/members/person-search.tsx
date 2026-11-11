"use client"

import { useQuery } from "@tanstack/react-query"
import { Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { type KeyboardEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { useDebounced } from "@/hooks/use-debounced"
import { useFormat } from "@/i18n/format"
import { preferredName } from "@/lib/domain/names"
import { placeLabel } from "@/lib/domain/place"

import { type DirectoryEntry, directoryQuery } from "./api"

const MIN_LETTERS = 2
const DEBOUNCE_MS = 250

export function groupsText(person: DirectoryEntry, separator: string, none: string) {
  if (person.groups.length === 0) {
    return none
  }

  return person.groups.map(placeLabel).join(separator)
}

export function ignoreEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") {
    event.preventDefault()
  }
}

export function PersonSearch({
  chosen,
  onChange,
  label,
}: {
  chosen: DirectoryEntry[]
  onChange: (people: DirectoryEntry[]) => void
  label: string
}) {
  const t = useTranslations("accountRequests.approve")
  const f = useFormat()
  const [text, setText] = useState("")
  const q = useDebounced(text.trim(), DEBOUNCE_MS)
  const ready = q.length >= MIN_LETTERS && text.trim().length >= MIN_LETTERS
  const found = useQuery({ ...directoryQuery(q), enabled: ready })
  const chosenIds = new Set(chosen.map((person) => person.id))
  const none = t("noGroup")

  function results() {
    if (!ready) {
      return <p className="text-xs text-muted-foreground">{t("searchToAdd")}</p>
    }

    if (!found.data) {
      return null
    }

    const offered = found.data.items.filter((person) => !chosenIds.has(person.id))

    if (offered.length === 0) {
      return <p className="text-xs text-muted-foreground">{t("noChildMatches")}</p>
    }

    return (
      <ul className="flex flex-col divide-y border-y">
        {offered.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              className="flex w-full min-w-0 flex-col py-2 text-start hover:bg-muted/60"
              onClick={() => onChange([...chosen, person])}
            >
              <span className="truncate text-sm font-medium">{preferredName(person)}</span>
              <span className="truncate text-xs text-muted-foreground">
                {groupsText(person, f.separator, none)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {chosen.length > 0 ? (
        <ul
          className="flex flex-col divide-y border-y"
          aria-label={t("selected", { count: chosen.length })}
        >
          {chosen.map((person) => (
            <li key={person.id} className="flex items-center justify-between gap-3 py-2">
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{preferredName(person)}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {groupsText(person, f.separator, none)}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("removePerson", { name: preferredName(person) })}
                onClick={() => onChange(chosen.filter((p) => p.id !== person.id))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {t("selected", { count: chosen.length })}
      </p>
      <InputGroup>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          aria-label={label}
          placeholder={t("findChild")}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={ignoreEnter}
        />
      </InputGroup>
      {results()}
    </div>
  )
}
