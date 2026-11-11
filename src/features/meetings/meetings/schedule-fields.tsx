"use client"

import { useTranslations } from "next-intl"

import { SelectField, TextAreaField, TextField } from "@/components/form-fields"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { NativeSelectOption } from "@/components/ui/native-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Service } from "@/features/organization/services/api"
import { useFormat } from "@/i18n/format"
import type { LocalDate } from "@/lib/api/types/common"
import { addDays } from "@/lib/domain/time"
import { oneOf } from "@/lib/one-of"

import { groupOf } from "./session-lines"
import type { RosterMode } from "./api"
import type { Draft, DraftFieldsProps, Preview, ScheduleTarget } from "./schedule-draft"

const ROSTER_MODES: RosterMode[] = ["expected", "open"]

function RosterModeField({
  draft,
  services,
  target,
  onChange,
}: Omit<DraftFieldsProps, "errors"> & { services: Service[]; target: ScheduleTarget }) {
  const t = useTranslations("meetings")
  const service = services.find((s) => s.id === draft.serviceId)
  const stage = service?.stages.find((s) => s.id === draft.stageId)

  const group =
    stage?.name ?? service?.name ?? (target.mode === "edit" ? groupOf(target.schedule) : undefined)

  const rosterHintOf = () => {
    if (stage) {
      return t("form.rosterStage")
    }

    return service && service.stages.length > 0
      ? t("form.rosterServiceOnly")
      : t("form.rosterService")
  }

  const rosterHint = rosterHintOf()

  return (
    <FieldSet>
      <FieldLegend>{t("fields.whoIsExpected")}</FieldLegend>
      <RadioGroup
        value={draft.rosterMode}
        onValueChange={(value) =>
          onChange({ rosterMode: oneOf(ROSTER_MODES, value) ?? draft.rosterMode })
        }
      >
        <Field orientation="horizontal">
          <RadioGroupItem value="expected" id="roster-expected" />
          <div className="flex flex-col gap-0.5">
            <FieldLabel htmlFor="roster-expected" className="font-normal">
              {group ? t("form.rosterOf", { group }) : t("form.rosterOfService")}
            </FieldLabel>
            <FieldDescription>{[rosterHint, t("form.rosterHint")].join(" ")}</FieldDescription>
          </div>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="open" id="roster-open" />
          <div className="flex flex-col gap-0.5">
            <FieldLabel htmlFor="roster-open" className="font-normal">
              {t("roster.open")}
            </FieldLabel>
            <FieldDescription>{t("form.openHint")}</FieldDescription>
          </div>
        </Field>
      </RadioGroup>
    </FieldSet>
  )
}

export function DetailsFields({
  draft,
  errors,
  services,
  target,
  onChange,
}: DraftFieldsProps & { services: Service[]; target: ScheduleTarget }) {
  const t = useTranslations("meetings")
  const schedule = target.mode === "edit" ? target.schedule : null
  const service = services.find((s) => s.id === draft.serviceId)

  return (
    <FieldGroup className="gap-6 md:pe-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={t("fields.service")}
          value={draft.serviceId}
          disabled={schedule !== null || (target.mode === "create" && !!target.fixedServiceId)}
          error={errors["roster.serviceId"]}
          onChange={(event) => onChange({ serviceId: event.target.value, stageId: "" })}
        >
          {schedule?.service ? (
            <NativeSelectOption value={schedule.service.id}>
              {schedule.service.name}
            </NativeSelectOption>
          ) : null}
          {services
            .filter((s) => s.id !== schedule?.service?.id)
            .map((s) => (
              <NativeSelectOption key={s.id} value={s.id}>
                {s.name}
              </NativeSelectOption>
            ))}
        </SelectField>
        <SelectField
          label={t("fields.stage")}
          value={draft.stageId}
          disabled={schedule !== null}
          error={errors["roster.stageId"]}
          onChange={(event) => onChange({ stageId: event.target.value })}
        >
          <NativeSelectOption value="">{t("fields.wholeService")}</NativeSelectOption>
          {schedule?.stage ? (
            <NativeSelectOption value={schedule.stage.id}>{schedule.stage.name}</NativeSelectOption>
          ) : null}
          {service?.stages
            .filter((s) => s.id !== schedule?.stage?.id)
            .map((s) => (
              <NativeSelectOption key={s.id} value={s.id}>
                {s.name}
              </NativeSelectOption>
            ))}
        </SelectField>
      </div>
      <TextField
        label={t("fields.name")}
        value={draft.name}
        onChange={(event) => onChange({ name: event.target.value })}
        maxLength={120}
        placeholder={t("form.namePlaceholder")}
        description={t("form.nameHint")}
        error={errors["details.name"]}
      />
      <TextField
        label={t("fields.place")}
        optional
        value={draft.location}
        onChange={(event) => onChange({ location: event.target.value })}
        maxLength={120}
        placeholder={t("form.placePlaceholder")}
        error={errors["details.location"]}
      />
      <RosterModeField draft={draft} services={services} target={target} onChange={onChange} />
      <TextAreaField
        label={t("form.notes")}
        optional
        dir="auto"
        value={draft.description}
        onChange={(event) => onChange({ description: event.target.value })}
        maxLength={500}
        error={errors["details.description"]}
      />
    </FieldGroup>
  )
}

export function TimeFields({ draft, errors, onChange }: DraftFieldsProps) {
  const t = useTranslations("meetings.form")

  return (
    <div className="grid grid-cols-2 gap-4">
      <TextField
        label={t("startsAt")}
        type="time"
        value={draft.startTime}
        onChange={(event) => onChange({ startTime: event.target.value })}
        error={errors["times.startTime"]}
      />
      <TextField
        label={t("endsAt")}
        type="time"
        optional
        value={draft.endTime}
        onChange={(event) => onChange({ endTime: event.target.value })}
        error={errors["times.endTime"]}
      />
      <TextField
        label={t("firstDate")}
        type="date"
        value={draft.startsOn}
        onChange={(event) => onChange({ startsOn: event.target.value })}
        error={errors["recurrence.span.startsOn"]}
      />
      <TextField
        label={t("lastDate")}
        type="date"
        optional
        value={draft.endsOn}
        onChange={(event) => onChange({ endsOn: event.target.value })}
        description={t("lastDateHint")}
        error={errors["recurrence.span.endsOn"]}
      />
    </div>
  )
}

export function SchedulePreview({
  draft,
  preview,
  today,
}: {
  draft: Draft
  preview: Preview
  today: LocalDate
}) {
  const t = useTranslations()
  const f = useFormat()

  function firstCreated(first: LocalDate) {
    if (first <= addDays(today, 1)) {
      return t("meetings.form.firstRightAway")
    }

    const createdOn = addDays(first, -1)

    return createdOn === addDays(today, 1)
      ? t("meetings.form.firstTomorrow")
      : t("meetings.form.firstOn", { date: f.dayMonth(createdOn) })
  }

  function previewLines() {
    if (preview.error) {
      return (
        <span className="text-muted-foreground">{t(`errors.recurrence.${preview.error}`)}</span>
      )
    }

    if (preview.dates.length === 0) {
      return <span className="text-muted-foreground">{t("meetings.form.previewNone")}</span>
    }

    return (
      <>
        <span>
          {t("meetings.form.previewPattern", {
            pattern: f.recurrence(preview.recurrence),
            time: f.timeRange(draft.startTime, draft.endTime || null),
          })}
        </span>
        <span className="text-muted-foreground">
          {t("meetings.form.previewNext", {
            dates: preview.dates
              .map((date) => f.dayMonth(date))
              .join(t("meetings.form.dateSeparator")),
          }).replace(/\.\.$/, ".")}{" "}
          {firstCreated(preview.dates[0])}
        </span>
      </>
    )
  }

  return (
    <div
      aria-live="polite"
      data-testid="schedule-preview"
      className="flex flex-col gap-1.5 bg-muted/60 p-4 text-sm"
    >
      <span className="text-xs font-semibold tracking-wider uppercase">
        {t("meetings.form.preview")}
      </span>
      {previewLines()}
    </div>
  )
}
