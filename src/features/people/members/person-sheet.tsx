"use client"

import { useTranslations } from "next-intl"

import { MemberAvatar } from "@/components/member-avatar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCan } from "@/features/identity/auth/session"
import { useInlineEnd } from "@/i18n/direction"
import { fullName, initials, preferredName } from "@/lib/domain/names"
import { canInAny, groupAt } from "@/lib/permissions"

import { AddMembership } from "./add-membership"
import type { PersonRow } from "./api"
import { NameForm } from "./name-form"
import { InactiveBadge, StatusAction } from "./person-status"
import { EarlierPlacements, Placements } from "./placements"

export function PersonSheet({
  row,
  onOpenChange,
  onStatusChange,
}: {
  row: PersonRow | null
  onOpenChange: (open: boolean) => void
  onStatusChange: (row: PersonRow) => void
}) {
  const t = useTranslations("members.sheet")
  const can = useCan()
  const side = useInlineEnd()

  const edit =
    row !== null &&
    canInAny(
      can,
      "update",
      "members",
      row.placements.map((placement) => groupAt(placement.service, placement.stage))
    )

  return (
    <Sheet open={row !== null} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="w-full gap-6 overflow-y-auto sm:max-w-md">
        {row ? (
          <>
            <SheetHeader className="flex-row items-center gap-3">
              <MemberAvatar
                name={preferredName(row.person)}
                initials={initials(row.person)}
                seed={row.person.id}
                className="size-10"
              />
              <span className="flex min-w-0 flex-col">
                <span className="flex min-w-0 items-center gap-2">
                  <SheetTitle className="truncate">{preferredName(row.person)}</SheetTitle>
                  {row.person.status === "inactive" ? <InactiveBadge /> : null}
                </span>
                <SheetDescription className="truncate">
                  {row.person.displayName ? fullName(row.person) : t("member")}
                </SheetDescription>
              </span>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-4 pb-6">
              {edit ? <NameForm key={row.person.id} person={row.person} /> : null}
              <Placements row={row} />
              {edit && row.person.status === "active" ? <AddMembership row={row} /> : null}
              <EarlierPlacements placements={row.pastPlacements} />
            </div>
            {edit ? (
              <SheetFooter className="border-t">
                <StatusAction row={row} onChange={onStatusChange} />
              </SheetFooter>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
