"use client"

import { cn } from "@/lib/utils"
import { Check, Undo2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { MemberAvatar } from "@/components/member-avatar"
import { Button } from "@/components/ui/button"
import { useFormat } from "@/i18n/format"
import type { PersonReference } from "@/features/people/members/api"
import { fullName, initials, preferredName } from "@/lib/domain/names"
import { placeLabel } from "@/lib/domain/place"

import type { MarkReference, PersonGroup } from "./api"

export type BoardActions = {
  onMark?: (person: PersonReference) => void
  onUndo?: (person: PersonReference, mark: MarkReference) => void
  onClose?: () => void
  onCorrect?: () => void
  pending?: ReadonlySet<string>
  saving?: boolean
}

const placementText = (placements: PersonGroup[]) => placements.map(placeLabel).join(", ")

function MarkControl({
  person,
  mark,
  canRecord,
  canRemove,
  actions,
}: {
  person: PersonReference
  mark: MarkReference | null
  canRecord: boolean
  canRemove: boolean
  actions: BoardActions
}) {
  const t = useTranslations("attendance.board")
  const f = useFormat()
  const name = preferredName(person)

  if (mark) {
    return (
      <span className="flex shrink-0 items-center gap-1">
        <span className="inline-flex h-10 items-center gap-1.5 px-2 text-sm font-medium text-success">
          <Check className="size-4" aria-hidden="true" />
          <span>
            {t("present")}
            {mark.recordedAt ? (
              <span className="hidden sm:inline"> · {f.instantTime(mark.recordedAt)}</span>
            ) : null}
          </span>
        </span>
        {canRemove ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("undo", { name })}
            disabled={!actions.onUndo || actions.pending?.has(person.id)}
            onClick={() => actions.onUndo?.(person, mark)}
          >
            <Undo2 />
          </Button>
        ) : null}
      </span>
    )
  }

  if (canRecord) {
    return (
      <Button
        variant="outline"
        className="h-10 w-32 shrink-0"
        aria-label={t("mark", { name })}
        disabled={!actions.onMark || actions.pending?.has(person.id)}
        onClick={() => actions.onMark?.(person)}
      >
        {t("present")}
      </Button>
    )
  }

  return <span className="text-xs text-muted-foreground">{t("notMarked")}</span>
}

export function PersonRow({
  person,
  mark,
  placements,
  canRecord,
  canRemove = false,
  actions,
}: {
  person: PersonReference
  mark: MarkReference | null
  placements?: PersonGroup[]
  canRecord: boolean
  canRemove?: boolean
  actions: BoardActions
}) {
  const t = useTranslations("attendance.board")
  const name = preferredName(person)

  const detailLine = () => {
    if (placements) {
      return placementText(placements) || t("noGroup")
    }

    return person.displayName ? fullName(person) : null
  }

  const detail = detailLine()

  return (
    <li className={cn("flex items-center gap-3 py-2.5", mark && "bg-success-soft/40")}>
      <MemberAvatar name={name} initials={initials(person)} seed={person.id} className="ms-1" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{name}</span>
        {detail ? <span className="truncate text-xs text-muted-foreground">{detail}</span> : null}
      </span>
      <MarkControl
        person={person}
        mark={mark}
        canRecord={canRecord}
        canRemove={canRemove}
        actions={actions}
      />
    </li>
  )
}
