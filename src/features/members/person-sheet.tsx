"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { TextField } from "@/components/form-fields"
import { MemberAvatar } from "@/components/member-avatar"
import { ServiceSwatch } from "@/components/service-tag"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useInlineEnd } from "@/i18n/direction"
import { useFormat } from "@/i18n/format"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { fullName, initials, preferredName } from "@/lib/domain/names"

import {
  endMembershipRequest,
  joinRequest,
  type PersonNames,
  type PersonRow,
  type Placement,
  renamePersonRequest,
} from "./api"
import { useGroupOptions } from "./groups"

const PEOPLE_QUERIES = [["people"], ["services"]]

function useWhere() {
  const t = useTranslations("members.sheet")

  return (p: Pick<Placement, "service" | "stage">) =>
    p.stage
      ? `${p.stage.name} (${p.service.name})`
      : t("serviceNoStage", { service: p.service.name })
}

function NameForm({ person }: { person: PersonRow["person"] }) {
  const t = useTranslations()

  const [edits, setEdits] = useState<Partial<PersonNames>>({})

  const names: PersonNames = {
    firstName: edits.firstName ?? person.firstName,
    lastName: edits.lastName ?? person.lastName,
    displayName: edits.displayName === undefined ? person.displayName : edits.displayName,
  }

  const rename = useApiMutation(
    (changes: Partial<PersonNames>) => renamePersonRequest(person.id, changes),
    { successMessage: t("toast.saved"), invalidate: PEOPLE_QUERIES, onSuccess: () => setEdits({}) }
  )

  const changes: Partial<PersonNames> = {}

  if (names.firstName !== person.firstName) {
    changes.firstName = names.firstName
  }

  if (names.lastName !== person.lastName) {
    changes.lastName = names.lastName
  }

  if ((names.displayName || null) !== person.displayName) {
    changes.displayName = names.displayName || null
  }

  const changed = Object.keys(changes).length > 0

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()

        if (changed) {
          void rename.execute(changes)
        }
      }}
    >
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("members.fields.firstName")}
            maxLength={80}
            value={names.firstName}
            onChange={(event) => setEdits({ ...edits, firstName: event.target.value })}
            error={rename.fieldErrors.firstName}
          />
          <TextField
            label={t("members.fields.lastName")}
            maxLength={80}
            value={names.lastName}
            onChange={(event) => setEdits({ ...edits, lastName: event.target.value })}
            error={rename.fieldErrors.lastName}
          />
        </div>
        <TextField
          label={t("members.fields.displayName")}
          optional
          maxLength={120}
          description={t("members.fields.displayNameHintShort")}
          value={names.displayName ?? ""}
          onChange={(event) => setEdits({ ...edits, displayName: event.target.value })}
          error={rename.fieldErrors.displayName}
        />
      </FieldGroup>
      {changed ? (
        <Button type="submit" className="self-start" disabled={rename.pending}>
          {t("members.sheet.saveName")}
        </Button>
      ) : null}
    </form>
  )
}

function Placements({ person, onGone }: { person: PersonRow; onGone: () => void }) {
  const t = useTranslations()
  const f = useFormat()
  const where = useWhere()
  const [ending, setEnding] = useState<Placement | null>(null)

  const end = useApiMutation(endMembershipRequest, {
    successMessage: t("toast.membershipEnded"),
    invalidate: PEOPLE_QUERIES,
  })

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t("members.belongsTo")}
      </h3>
      {person.placements.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("members.sheet.noServiceNow")}</p>
      ) : (
        <ul className="flex flex-col divide-y border-y">
          {person.placements.map((placement) => (
            <li
              key={placement.membershipId}
              className="flex items-center justify-between gap-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <ServiceSwatch tone={placement.service.tone} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm">{where(placement)}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("members.sheet.since", { date: f.mediumDate(placement.startsOn) })}
                  </span>
                </span>
              </span>
              {person.can.edit ? (
                <Button variant="ghost" size="sm" onClick={() => setEnding(placement)}>
                  {t("members.membership.removeFrom", { where: where(placement) })}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={ending !== null}
        onOpenChange={(open) => !open && setEnding(null)}
        title={
          ending
            ? t("members.membership.removeTitle", {
                name: preferredName(person.person),
                where: where(ending),
              })
            : ""
        }
        description={t("members.membership.removeDescription")}
        confirmLabel={t("members.membership.remove")}
        tone="destructive"
        onConfirm={async () => {
          if (!ending) {
            return true
          }

          const result = await end.execute(ending.membershipId)

          if (result.ok && person.placements.length === 1 && !person.can.edit) {
            onGone()
          }

          return result.ok
        }}
      />
    </section>
  )
}

function AddTo({ person }: { person: PersonRow }) {
  const t = useTranslations()
  const options = useGroupOptions()

  const current = new Set(
    person.placements.map((p) => (p.stage ? `stage:${p.stage.id}` : `service:${p.service.id}`))
  )

  const missing = options.filter((option) => !current.has(option.value))
  const [chosen, setChosen] = useState("")

  const join = useApiMutation(joinRequest, {
    successMessage: t("toast.membershipAdded"),
    invalidate: PEOPLE_QUERIES,
    onSuccess: () => setChosen(""),
  })

  if (missing.length === 0) {
    return null
  }

  const option = missing.find((o) => o.value === chosen) ?? missing[0]

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t("members.sheet.addTo")}
      </h3>
      <div className="flex gap-2">
        <NativeSelect
          aria-label={t("members.sheet.addTo")}
          className="w-full"
          value={option.value}
          onChange={(event) => setChosen(event.target.value)}
        >
          {missing.map((o) => (
            <NativeSelectOption key={o.value} value={o.value}>
              {o.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button
          variant="outline"
          disabled={join.pending}
          onClick={() => void join.execute(person.person.id, option.placement)}
        >
          {t("members.sheet.add")}
        </Button>
      </div>
    </section>
  )
}

function Earlier({ placements }: { placements: Placement[] }) {
  const t = useTranslations("members.sheet")
  const f = useFormat()
  const where = useWhere()

  if (placements.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t("earlier")}
      </h3>
      <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
        {placements.map((placement) => (
          <li key={placement.membershipId}>
            {t("pastPlacement", {
              where: where(placement),
              from: f.mediumDate(placement.startsOn),
              to: placement.endsOn ? f.mediumDate(placement.endsOn) : "",
            })}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function PersonSheet({
  person,
  onOpenChange,
}: {
  person: PersonRow | null
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("members.sheet")
  const side = useInlineEnd()

  return (
    <Sheet open={person !== null} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="w-full gap-6 overflow-y-auto sm:max-w-md">
        {person ? (
          <>
            <SheetHeader className="flex-row items-center gap-3">
              <MemberAvatar
                name={preferredName(person.person)}
                initials={initials(person.person)}
                seed={person.person.id}
                className="size-10"
              />
              <span className="flex min-w-0 flex-col">
                <SheetTitle className="truncate">{preferredName(person.person)}</SheetTitle>
                <SheetDescription className="truncate">
                  {person.person.displayName ? fullName(person.person) : t("member")}
                </SheetDescription>
              </span>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-4 pb-6">
              {person.can.edit ? <NameForm key={person.person.id} person={person.person} /> : null}
              <Placements person={person} onGone={() => onOpenChange(false)} />
              {person.can.edit ? <AddTo person={person} /> : null}
              <Earlier placements={person.pastPlacements} />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
