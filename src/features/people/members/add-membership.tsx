"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { useApiMutation } from "@/lib/api/use-api-mutation"

import { addMembershipRequest, MEMBERSHIP_QUERIES, type PersonRow } from "./api"
import { blocksPlacement, useGroupOptions } from "./groups"

export function AddMembership({ row }: { row: PersonRow }) {
  const t = useTranslations()
  const options = useGroupOptions()

  const held = row.placements.map((p) => ({
    serviceId: p.service.id,
    stageId: p.stage?.id ?? null,
  }))

  const missing = options.filter(
    (option) => !held.some((placement) => blocksPlacement(placement, option.placement))
  )

  const [chosen, setChosen] = useState("")

  const join = useApiMutation(addMembershipRequest, {
    successMessage: t("members.toast.membershipAdded"),
    invalidate: MEMBERSHIP_QUERIES,
    awaitRefetch: true,
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
          onClick={() => void join.execute(row.person.id, option.placement)}
        >
          {join.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("members.sheet.add")}
        </Button>
      </div>
    </section>
  )
}
