"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "cn"
import { CalendarClock, Info, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { FormDialog } from "@/components/form-dialog"
import { SelectField, TextAreaField, TextField } from "@/components/form-fields"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { type ServiceRow, servicesQuery } from "@/features/organization/services/api"
import { useFormat } from "@/i18n/format"
import { useRouter } from "@/i18n/navigation"
import { routes } from "@/lib/routes"
import type {
  Frequency,
  IsoWeekday,
  LocalDate,
  MonthWeek,
  Recurrence,
  Uuid,
} from "@/lib/api/types/common"
import { groupOf, type RosterMode, type ScheduleSummary } from "@/lib/api/types/meetings"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import {
  normalizeWeekdays,
  occurrencesBetween,
  RecurrenceError,
  type RecurrenceProblem,
  validateRecurrence,
  recurrenceOf,
} from "@/lib/domain/recurrence"
import { addDays } from "@/lib/domain/time"
import { oneOf } from "@/lib/one-of"

import {
  type ScheduleChanges,
  createScheduleRequest,
  SCHEDULE_QUERIES,
  updateScheduleRequest,
} from "./api"

const WEEKDAYS: IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7]
const MONTH_WEEKS: MonthWeek[] = [1, 2, 3, 4, -1]
const FREQUENCIES: Frequency[] = ["weekly", "monthly"]
const ROSTER_MODES: RosterMode[] = ["expected", "open"]
const PREVIEW_DATES = 4
const PREVIEW_HORIZON_DAYS = 400

const SELECTED =
  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"

type Draft = {
  serviceId: string
  stageId: string
  name: string
  description: string
  location: string
  frequency: Frequency
  interval: number
  weekdays: IsoWeekday[]
  monthWeek: MonthWeek
  monthWeekday: IsoWeekday
  startsOn: string
  endsOn: string
  startTime: string
  endTime: string
  rosterMode: RosterMode
}

function initialDraft(
  today: LocalDate,
  services: ServiceRow[],
  fixedServiceId: Uuid | undefined,
  schedule?: ScheduleSummary
): Draft {
  if (schedule) {
    const r = recurrenceOf(schedule.recurrence)

    return {
      serviceId: schedule.service?.id ?? "",
      stageId: schedule.stage?.id ?? "",
      name: schedule.name,
      description: schedule.description ?? "",
      location: schedule.location ?? "",
      frequency: r.frequency,
      interval: r.interval,
      weekdays: r.frequency === "weekly" ? r.weekdays : [7],
      monthWeek: r.monthWeek ?? 1,
      monthWeekday: r.weekdays[0],
      startsOn: r.span.startsOn,
      endsOn: r.span.endsOn ?? "",
      startTime: schedule.startTime,
      endTime: schedule.endTime ?? "",
      rosterMode: schedule.rosterMode,
    }
  }

  return {
    serviceId: fixedServiceId ?? services[0]?.id ?? "",
    stageId: "",
    name: "",
    description: "",
    location: "",
    frequency: "weekly",
    interval: 1,
    weekdays: [7],
    monthWeek: 1,
    monthWeekday: 6,
    startsOn: today,
    endsOn: "",
    startTime: "18:00",
    endTime: "19:30",
    rosterMode: "expected",
  }
}

function toRecurrence(d: Draft): Recurrence {
  return {
    frequency: d.frequency,
    interval: d.interval,
    weekdays: d.frequency === "weekly" ? normalizeWeekdays(d.weekdays) : [d.monthWeekday],
    monthWeek: d.frequency === "monthly" ? d.monthWeek : null,
    span: { startsOn: d.startsOn, endsOn: d.endsOn || null },
  }
}

type Preview =
  | { error: RecurrenceProblem; dates: LocalDate[]; recurrence: null }
  | { error: null; dates: LocalDate[]; recurrence: Recurrence }

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/

const INTERVALS: Record<Draft["frequency"], number[]> = {
  weekly: [1, 2, 3, 4],
  monthly: [1, 2, 3, 6],
}

function previewOf(d: Draft, today: LocalDate): Preview {
  if (!LOCAL_DATE.test(d.startsOn) || Number.isNaN(Date.parse(d.startsOn))) {
    return { error: "startsOn", dates: [], recurrence: null }
  }

  const recurrence = toRecurrence(d)

  try {
    validateRecurrence(recurrence)
  } catch (error) {
    if (error instanceof RecurrenceError) {
      return { error: error.code, dates: [], recurrence: null }
    }

    throw error
  }

  const from = d.startsOn > today ? d.startsOn : today

  return {
    error: null,
    dates: occurrencesBetween(recurrence, from, addDays(from, PREVIEW_HORIZON_DAYS)).slice(
      0,
      PREVIEW_DATES
    ),
    recurrence,
  }
}

const FIELDS = {
  service: "roster.serviceId",
  stage: "roster.stageId",
  name: "details.name",
  description: "details.description",
  location: "details.location",
  startTime: "times.startTime",
  endTime: "times.endTime",
} as const

const RECURRENCE_FIELDS = [
  "recurrence.interval",
  "recurrence.weekdays",
  "recurrence.monthWeek",
  "recurrence.span.endsOn",
] as const

function ScheduleForm({
  services,
  today,
  schedule,
  fixedServiceId,
  onClose,
}: {
  services: ServiceRow[]
  today: LocalDate
  schedule?: ScheduleSummary
  fixedServiceId?: Uuid
  onClose: () => void
}) {
  const t = useTranslations()
  const f = useFormat()
  const router = useRouter()
  const [d, setD] = useState<Draft>(() => initialDraft(today, services, fixedServiceId, schedule))

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setD((prev) => ({ ...prev, [key]: value }))

  const changeFrequency = (frequency: Draft["frequency"]) =>
    setD((prev) => ({
      ...prev,
      frequency,
      interval: INTERVALS[frequency].includes(prev.interval) ? prev.interval : 1,
    }))

  const create = useApiMutation(createScheduleRequest, {
    successMessage: (saved) => t("toast.scheduleCreated", { created: saved.createdSessions }),
    invalidate: SCHEDULE_QUERIES,
    onSuccess: (saved) => {
      onClose()
      router.push(routes.schedule(saved.id))
    },
  })

  const update = useApiMutation(
    (changes: ScheduleChanges) => updateScheduleRequest(schedule!.id, changes),
    {
      successMessage: (saved) => t("toast.scheduleSaved", { created: saved.createdSessions }),
      invalidate: SCHEDULE_QUERIES,
      onSuccess: onClose,
    }
  )

  const mutation = schedule ? update : create
  const errors = mutation.fieldErrors
  const preview = useMemo(() => previewOf(d, today), [d, today])
  const service = services.find((s) => s.id === d.serviceId)
  const stage = service?.stages.find((s) => s.id === d.stageId)
  const group = stage?.name ?? service?.name ?? (schedule ? groupOf(schedule) : undefined)
  const recurrenceError = RECURRENCE_FIELDS.map((field) => errors[field]).find(Boolean)

  function firstCreated(first: LocalDate) {
    if (first <= addDays(today, 1)) {
      return t("meetings.form.firstRightAway")
    }

    const createdOn = addDays(first, -1)

    return createdOn === addDays(today, 1)
      ? t("meetings.form.firstTomorrow")
      : t("meetings.form.firstOn", { date: f.dayMonth(createdOn) })
  }

  function submit() {
    if (preview.error) {
      return
    }

    const fields = {
      details: {
        name: d.name,
        description: d.description.trim() === "" ? null : d.description,
        location: d.location.trim() === "" ? null : d.location,
      },
      recurrence: toRecurrence(d),
      times: { startTime: d.startTime, endTime: d.endTime || null },
    }

    if (schedule) {
      void update.execute({ ...fields, rosterMode: d.rosterMode })
    } else {
      void create.execute({
        ...fields,
        roster: { serviceId: d.serviceId, stageId: d.stageId || null, mode: d.rosterMode },
      })
    }
  }

  const intervalSelect = (label: string, options: number[]) => (
    <NativeSelect
      aria-label={label}
      className="w-16"
      value={String(d.interval)}
      onChange={(event) => set("interval", Number(event.target.value))}
    >
      {options.map((n) => (
        <NativeSelectOption key={n} value={n}>
          {n}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )

  return (
    <FormDialog
      size="wide"
      icon={CalendarClock}
      title={schedule ? t("meetings.actions.edit") : t("meetings.form.newTitle")}
      description={
        schedule
          ? `${groupOf(schedule)} · ${f.recurrence(recurrenceOf(schedule.recurrence))}`
          : t("meetings.form.newDescription")
      }
      pending={mutation.pending}
      problem={mutation.problem}
      submitLabel={schedule ? t("meetings.form.save") : t("meetings.form.create")}
      submitDisabled={preview.error !== null}
      onSubmit={submit}
      onClose={onClose}
    >
      {schedule ? (
        <Alert>
          <Info />
          <AlertTitle>{t("meetings.form.editAlertTitle")}</AlertTitle>
          <AlertDescription>{t("meetings.form.editAlertDescription")}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-y-8 md:grid-cols-2">
        <FieldGroup className="gap-6 md:pe-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label={t("meetings.fields.service")}
              value={d.serviceId}
              disabled={!!schedule || !!fixedServiceId}
              error={errors[FIELDS.service]}
              onChange={(event) =>
                setD((prev) => ({ ...prev, serviceId: event.target.value, stageId: "" }))
              }
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
              label={t("meetings.fields.stage")}
              value={d.stageId}
              disabled={!!schedule}
              error={errors[FIELDS.stage]}
              onChange={(event) => set("stageId", event.target.value)}
            >
              <NativeSelectOption value="">{t("meetings.fields.wholeService")}</NativeSelectOption>
              {schedule?.stage ? (
                <NativeSelectOption value={schedule.stage.id}>
                  {schedule.stage.name}
                </NativeSelectOption>
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
            label={t("meetings.fields.name")}
            value={d.name}
            onChange={(event) => set("name", event.target.value)}
            maxLength={120}
            placeholder={t("meetings.form.namePlaceholder")}
            description={t("meetings.form.nameHint")}
            error={errors[FIELDS.name]}
          />
          <TextField
            label={t("meetings.fields.place")}
            optional
            value={d.location}
            onChange={(event) => set("location", event.target.value)}
            maxLength={120}
            placeholder={t("meetings.form.placePlaceholder")}
            error={errors[FIELDS.location]}
          />
          <FieldSet>
            <FieldLegend>{t("meetings.fields.whoIsExpected")}</FieldLegend>
            <RadioGroup
              value={d.rosterMode}
              onValueChange={(value) =>
                set("rosterMode", oneOf(ROSTER_MODES, value) ?? d.rosterMode)
              }
            >
              <Field orientation="horizontal">
                <RadioGroupItem value="expected" id="roster-expected" />
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="roster-expected" className="font-normal">
                    {group
                      ? t("meetings.form.rosterOf", { group })
                      : t("meetings.form.rosterOfService")}
                  </FieldLabel>
                  <FieldDescription>
                    {[
                      stage
                        ? t("meetings.form.rosterStage")
                        : service && service.stages.length > 0
                          ? t("meetings.form.rosterServiceOnly")
                          : t("meetings.form.rosterService"),
                      t("meetings.form.rosterHint"),
                    ].join(" ")}
                  </FieldDescription>
                </div>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem value="open" id="roster-open" />
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="roster-open" className="font-normal">
                    {t("meetings.roster.open")}
                  </FieldLabel>
                  <FieldDescription>{t("meetings.form.openHint")}</FieldDescription>
                </div>
              </Field>
            </RadioGroup>
          </FieldSet>
          <TextAreaField
            label={t("meetings.form.notes")}
            optional
            dir="auto"
            value={d.description}
            onChange={(event) => set("description", event.target.value)}
            maxLength={500}
            error={errors[FIELDS.description]}
          />
        </FieldGroup>

        <div className="flex min-w-0 flex-col gap-6 md:border-s md:ps-8">
          <FieldSet data-invalid={recurrenceError ? true : undefined}>
            <FieldLegend>{t("meetings.schedule.repeats")}</FieldLegend>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={d.frequency}
              onValueChange={(value) => {
                const frequency = oneOf(FREQUENCIES, value)

                if (frequency) {
                  changeFrequency(frequency)
                }
              }}
              aria-label={t("meetings.form.frequency")}
            >
              <ToggleGroupItem value="weekly" className={SELECTED}>
                {t("meetings.form.weekly")}
              </ToggleGroupItem>
              <ToggleGroupItem value="monthly" className={SELECTED}>
                {t("meetings.form.monthly")}
              </ToggleGroupItem>
            </ToggleGroup>
            {d.frequency === "weekly" ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {t.rich("meetings.form.everyWeeks", {
                    count: d.interval,
                    interval: () =>
                      intervalSelect(t("meetings.form.weeksInterval"), INTERVALS.weekly),
                  })}
                </div>
                <ToggleGroup
                  type="multiple"
                  variant="outline"
                  spacing={0}
                  value={d.weekdays.map(String)}
                  onValueChange={(value) =>
                    set(
                      "weekdays",
                      value.flatMap((day) => oneOf(WEEKDAYS, Number(day)) ?? [])
                    )
                  }
                  aria-label={t("meetings.form.weekdays")}
                  aria-invalid={errors["recurrence.weekdays"] ? true : undefined}
                  className="flex-wrap"
                >
                  {WEEKDAYS.map((weekday) => (
                    <ToggleGroupItem
                      key={weekday}
                      value={String(weekday)}
                      aria-label={f.weekdayName(weekday)}
                      className={cn("px-3!", SELECTED)}
                    >
                      {f.weekdayMin(weekday)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {t.rich("meetings.form.monthlyOn", {
                  count: d.interval,
                  week: () => (
                    <NativeSelect
                      aria-label={t("meetings.form.monthWeek")}
                      className="w-24"
                      value={String(d.monthWeek)}
                      onChange={(event) =>
                        set(
                          "monthWeek",
                          oneOf(MONTH_WEEKS, Number(event.target.value)) ?? d.monthWeek
                        )
                      }
                    >
                      {MONTH_WEEKS.map((week) => (
                        <NativeSelectOption key={week} value={week}>
                          {f.monthWeekName(week)}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  ),
                  weekday: () => (
                    <NativeSelect
                      aria-label={t("meetings.form.weekday")}
                      className="w-32"
                      value={String(d.monthWeekday)}
                      onChange={(event) =>
                        set(
                          "monthWeekday",
                          oneOf(WEEKDAYS, Number(event.target.value)) ?? d.monthWeekday
                        )
                      }
                    >
                      {WEEKDAYS.map((weekday) => (
                        <NativeSelectOption key={weekday} value={weekday}>
                          {f.weekdayName(weekday)}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  ),
                  interval: () =>
                    intervalSelect(t("meetings.form.monthsInterval"), INTERVALS.monthly),
                })}
              </div>
            )}
            {recurrenceError ? <FieldError>{recurrenceError}</FieldError> : null}
          </FieldSet>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label={t("meetings.form.startsAt")}
              type="time"
              value={d.startTime}
              onChange={(event) => set("startTime", event.target.value)}
              error={errors[FIELDS.startTime]}
            />
            <TextField
              label={t("meetings.form.endsAt")}
              type="time"
              optional
              value={d.endTime}
              onChange={(event) => set("endTime", event.target.value)}
              error={errors[FIELDS.endTime]}
            />
            <TextField
              label={t("meetings.form.firstDate")}
              type="date"
              value={d.startsOn}
              onChange={(event) => set("startsOn", event.target.value)}
              error={errors["recurrence.span.startsOn"]}
            />
            <TextField
              label={t("meetings.form.lastDate")}
              type="date"
              optional
              value={d.endsOn}
              onChange={(event) => set("endsOn", event.target.value)}
              description={t("meetings.form.lastDateHint")}
              error={errors["recurrence.span.endsOn"]}
            />
          </div>

          <div
            aria-live="polite"
            data-testid="schedule-preview"
            className="flex flex-col gap-1.5 bg-muted/60 p-4 text-sm"
          >
            <span className="text-xs font-semibold tracking-wider uppercase">
              {t("meetings.form.preview")}
            </span>
            {preview.error ? (
              <span className="text-muted-foreground">
                {t(`errors.recurrence.${preview.error}`)}
              </span>
            ) : preview.dates.length === 0 ? (
              <span className="text-muted-foreground">{t("meetings.form.previewNone")}</span>
            ) : (
              <>
                <span>
                  {t("meetings.form.previewPattern", {
                    pattern: f.recurrence(preview.recurrence),
                    time: f.timeRange(d.startTime, d.endTime || null),
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
            )}
          </div>
        </div>
      </div>
    </FormDialog>
  )
}

function ScheduleDialog({
  today,
  schedule,
  fixedServiceId,
  onClose,
}: {
  today: LocalDate
  schedule?: ScheduleSummary
  fixedServiceId?: Uuid
  onClose: () => void
}) {
  const services = useQuery(servicesQuery)

  if (!services.data) {
    return null
  }

  return (
    <ScheduleForm
      services={services.data.items.filter((s) => !s.archived)}
      today={today}
      schedule={schedule}
      fixedServiceId={fixedServiceId}
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
      {open ? (
        <ScheduleDialog
          today={today}
          fixedServiceId={fixedServiceId}
          onClose={() => setOpen(false)}
        />
      ) : null}
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
      {open ? (
        <ScheduleDialog today={today} schedule={schedule} onClose={() => setOpen(false)} />
      ) : null}
    </>
  )
}
