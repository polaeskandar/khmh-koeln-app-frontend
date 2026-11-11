"use client"

import { useQuery } from "@tanstack/react-query"
import { CalendarClock, Info, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { DialogMount } from "@/components/dialog-mount"
import { FormDialog } from "@/components/form-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { type ServiceRow, servicesQuery } from "@/features/organization/services/api"
import { useFormat } from "@/i18n/format"
import { useRouter } from "@/i18n/navigation"
import type { LocalDate, Uuid } from "@/lib/api/types/common"
import { groupOf } from "./session-lines"
import type { ScheduleSummary } from "@/lib/api/types/meetings"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { recurrenceOf } from "@/lib/domain/recurrence"
import { routes } from "@/lib/routes"

import { createScheduleRequest, SCHEDULE_QUERIES, updateScheduleRequest } from "./api"
import {
  type Draft,
  initialDraft,
  newScheduleOf,
  previewOf,
  scheduleChangesOf,
  type ScheduleTarget,
} from "./schedule-draft"
import { RecurrenceFields } from "./recurrence-fields"
import { DetailsFields, SchedulePreview, TimeFields } from "./schedule-fields"

function useSaveSchedule(onClose: () => void) {
  const t = useTranslations("toast")
  const router = useRouter()

  const create = useApiMutation(createScheduleRequest, {
    successMessage: (saved) => t("scheduleCreated", { created: saved.createdSessions }),
    invalidate: SCHEDULE_QUERIES,
    onSuccess: (saved) => {
      onClose()
      router.push(routes.schedule(saved.id))
    },
  })

  const update = useApiMutation(updateScheduleRequest, {
    successMessage: (saved) => t("scheduleSaved", { created: saved.createdSessions }),
    invalidate: SCHEDULE_QUERIES,
    onSuccess: onClose,
  })

  return { create, update }
}

function ScheduleForm({
  target,
  services,
  today,
  onClose,
}: {
  target: ScheduleTarget
  services: ServiceRow[]
  today: LocalDate
  onClose: () => void
}) {
  const t = useTranslations("meetings")
  const f = useFormat()
  const [draft, setDraft] = useState<Draft>(() => initialDraft(target, today, services))
  const { create, update } = useSaveSchedule(onClose)
  const mutation = target.mode === "edit" ? update : create
  const preview = useMemo(() => previewOf(draft, today), [draft, today])

  function changeDraft(changes: Partial<Draft>) {
    setDraft((previous) => ({ ...previous, ...changes }))
  }

  const fields = { draft, errors: mutation.fieldErrors, onChange: changeDraft }

  function submit() {
    if (preview.error) {
      return
    }

    if (target.mode === "edit") {
      void update.execute(target.schedule.id, scheduleChangesOf(draft))
    } else {
      void create.execute(newScheduleOf(draft))
    }
  }

  return (
    <FormDialog
      size="wide"
      icon={CalendarClock}
      title={target.mode === "edit" ? t("actions.edit") : t("form.newTitle")}
      description={
        target.mode === "edit"
          ? `${groupOf(target.schedule)} · ${f.recurrence(recurrenceOf(target.schedule.recurrence))}`
          : t("form.newDescription")
      }
      pending={mutation.pending}
      problem={mutation.problem}
      submitLabel={target.mode === "edit" ? t("form.save") : t("form.create")}
      submitDisabled={preview.error !== null}
      onSubmit={submit}
      onClose={onClose}
    >
      {target.mode === "edit" ? (
        <Alert>
          <Info />
          <AlertTitle>{t("form.editAlertTitle")}</AlertTitle>
          <AlertDescription>{t("form.editAlertDescription")}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-y-8 md:grid-cols-2">
        <DetailsFields {...fields} services={services} target={target} />
        <div className="flex min-w-0 flex-col gap-6 md:border-s md:ps-8">
          <RecurrenceFields {...fields} />
          <TimeFields {...fields} />
          <SchedulePreview draft={draft} preview={preview} today={today} />
        </div>
      </div>
    </FormDialog>
  )
}

function ScheduleDialog({
  target,
  today,
  onClose,
}: {
  target: ScheduleTarget
  today: LocalDate
  onClose: () => void
}) {
  const services = useQuery(servicesQuery)

  if (!services.data) {
    return null
  }

  return (
    <ScheduleForm
      target={target}
      services={services.data.items.filter((s) => !s.archived)}
      today={today}
      onClose={onClose}
    />
  )
}

export function NewScheduleButton({
  today,
  fixedServiceId,
}: {
  today: LocalDate
  fixedServiceId?: Uuid
}) {
  const t = useTranslations("meetings.form")
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        {t("newButton")}
      </Button>
      <DialogMount open={open}>
        <ScheduleDialog
          target={{ mode: "create", fixedServiceId }}
          today={today}
          onClose={() => setOpen(false)}
        />
      </DialogMount>
    </>
  )
}

export function EditScheduleButton({
  schedule,
  today,
}: {
  schedule: ScheduleSummary
  today: LocalDate
}) {
  const t = useTranslations("meetings.actions")
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {t("edit")}
      </Button>
      <DialogMount open={open}>
        <ScheduleDialog
          target={{ mode: "edit", schedule }}
          today={today}
          onClose={() => setOpen(false)}
        />
      </DialogMount>
    </>
  )
}
