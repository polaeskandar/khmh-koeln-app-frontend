"use client"

import { Link2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export type LinkRow = { label: string; url: string | null }

const MAX_ROWS = 10
const EMPTY_ROW: LinkRow = { label: "", url: null }

const isBlank = (row: LinkRow) => !row.label.trim() && !(row.url ?? "").trim()

function sentAfterRemoving(sent: number, removed: number) {
  if (sent === removed) {
    return -1
  }

  return sent > removed ? sent - 1 : sent
}

export function useLinkRows(initial: LinkRow[], { keepOneRow }: { keepOneRow: boolean }) {
  const [rows, setRows] = useState(initial.length === 0 && keepOneRow ? [EMPTY_ROW] : initial)
  const [sent, setSent] = useState<number[]>([])

  function update(row: number, change: Partial<LinkRow>) {
    setRows((list) => list.map((link, i) => (i === row ? { ...link, ...change } : link)))
  }

  function remove(row: number) {
    setRows((list) =>
      keepOneRow && list.length === 1 ? [EMPTY_ROW] : list.filter((_, i) => i !== row)
    )

    setSent((list) => list.map((i) => sentAfterRemoving(i, row)))
  }

  function toPayload(): LinkRow[] {
    const kept = rows.flatMap((link, i) => (isBlank(link) ? [] : [i]))
    setSent(kept)

    return kept.map((i) => {
      const { label, url } = rows[i]!

      return { label, url: url?.trim() ? url : null }
    })
  }

  return {
    rows,
    sent,
    full: rows.length >= MAX_ROWS,
    add: () => setRows((list) => [...list, EMPTY_ROW]),
    update,
    remove,
    toPayload,
  }
}

type LinkRows = ReturnType<typeof useLinkRows>

export type LinkRowTexts = {
  label: (n: number) => string
  link: (n: number) => string
  remove: (n: number) => string
  labelPlaceholder: string
  linkPlaceholder: string
  add: string
}

export function LinkRowsEditor({
  links,
  errors,
  prefix,
  texts,
}: {
  links: LinkRows
  errors: Record<string, string>
  prefix: string
  texts: LinkRowTexts
}) {
  function errorAt(row: number, key: keyof LinkRow) {
    const index = links.sent.indexOf(row)

    return index < 0 ? undefined : errors[`${prefix}.${index}.${key}`]
  }

  return (
    <>
      {links.rows.map((link, row) => {
        const labelError = errorAt(row, "label")
        const linkError = errorAt(row, "url")

        return (
          <div key={row} className="flex flex-col gap-1">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Input
                aria-label={texts.label(row + 1)}
                aria-invalid={labelError ? true : undefined}
                placeholder={texts.labelPlaceholder}
                dir="auto"
                value={link.label}
                maxLength={120}
                onChange={(event) => links.update(row, { label: event.target.value })}
              />
              <div className="relative col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                <Link2
                  className="pointer-events-none absolute start-0 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  aria-label={texts.link(row + 1)}
                  aria-invalid={linkError ? true : undefined}
                  placeholder={texts.linkPlaceholder}
                  dir="ltr"
                  className="ps-5"
                  value={link.url ?? ""}
                  onChange={(event) => links.update(row, { url: event.target.value || null })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={texts.remove(row + 1)}
                onClick={() => links.remove(row)}
              >
                <Trash2 />
              </Button>
            </div>
            {labelError || linkError ? <FieldError>{labelError ?? linkError}</FieldError> : null}
          </div>
        )
      })}
      {errors[prefix] ? <FieldError>{errors[prefix]}</FieldError> : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={links.full}
        onClick={links.add}
      >
        <Plus data-icon="inline-start" />
        {texts.add}
      </Button>
    </>
  )
}
