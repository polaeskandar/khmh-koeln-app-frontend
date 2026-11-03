"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "cn"
import { CalendarClock, Info, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState } from "react"

import { focusFirstInvalid } from "@/components/focus-first-invalid"
import { TextAreaField, TextField } from "@/components/form-fields"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { type ServiceRow, servicesQuery } from "@/features/services/api"
import { useFormat } from "@/i18n/format"
import { useRouter } from "@/i18n/navigation"
import { routes } from "@/lib/routes"
import type { IsoWeekday, LocalDate, MonthWeek, Recurrence, Uuid } from "@/lib/api/types/common"
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

import { createScheduleRequest, type ScheduleInput, updateScheduleRequest } from "./api"

const WEEKDAYS: IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7]
const MONTH_WEEKS: MonthWeek[] = [1, 2, 3, 4, -1]
const PREVIEW_DATES = 4
const PREVIEW_HORIZON_DAYS = 400
const MEETING_QUERIES = [["schedules"], ["agenda"], ["sessions"]]

const SELECTED =
  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"

type Draft = {
  serviceId: string
  stageId: string
  name: string
  description: string
  location: string
  frequency: "weekly" | "monthly"
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
      serviceId: schedule.service.id,
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

export function previewOf(d: Draft, today: LocalDate): Preview {
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
  onDone,
}: {
  services: ServiceRow[]
  today: LocalDate
  schedule?: ScheduleSummary
  fixedServiceId?: Uuid
  onDone: () => void
}) {
  const t = useTranslations()
  const f = useFormat()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [d, setD] = useState<Draft>(() => initialDraft(today, services, fixedServiceId, schedule))

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setD((prev) => ({ ...prev, [key]: value }))

  const create = useApiMutation(createScheduleRequest, {
    successMessage: (saved) => t("toast.scheduleCreated", { created: saved.createdSessions }),
    invalidate: MEETING_QUERIES,
    onSuccess: (saved) => {
      onDone()
      router.push(routes.schedule(saved.id))
    },
  })

  const update = useApiMutation(
    (changes: Omit<ScheduleInput, "serviceId" | "stageId">) =>
      updateScheduleRequest(schedule!.id, changes),
    {
      successMessage: (saved) => t("toast.scheduleSaved", { created: saved.createdSessions }),
      invalidate: MEETING_QUERIES,
      onSuccess: onDone,
    }
  )

  const mutation = schedule ? update : create
  const errors = mutation.fieldErrors
  const preview = useMemo(() => previewOf(d, today), [d, today])
  const service = services.find((s) => s.id === d.serviceId)
  const stage = service?.stages.find((s) => s.id === d.stageId)
  const group = stage?.name ?? service?.name ?? (schedule ? groupOf(schedule) : undefined)
  const recurrenceError = RECURRENCE_FIELDS.map((field) => errors[field]).find(Boolean)

  useEffect(() => {
    if (mutation.problem) {
      focusFirstInvalid(formRef.current)
    }
  }, [mutation.problem])

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
      name: d.name,
      description: d.description.trim() === "" ? null : d.description,
      location: d.location.trim() === "" ? null : d.location,
      recurrence: toRecurrence(d),
      startTime: d.startTime,
      endTime: d.endTime || null,
      rosterMode: d.rosterMode,
    }

    if (schedule) {
      void update.execute(fields)
    } else {
      void create.execute({ ...fields, serviceId: d.serviceId, stageId: d.stageId || null })
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
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
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
              <Field data-invalid={errors.serviceId ? true : undefined}>
                <FieldLabel htmlFor="schedule-service">{t("meetings.fields.service")}</FieldLabel>
                <NativeSelect
                  id="schedule-service"
                  className="w-full"
                  value={d.serviceId}
                  disabled={!!schedule || !!fixedServiceId}
                  aria-invalid={errors.serviceId ? true : undefined}
                  onChange={(event) =>
                    setD((prev) => ({ ...prev, serviceId: event.target.value, stageId: "" }))
                  }
                >
                  {schedule ? (
                    <NativeSelectOption value={schedule.service.id}>
                      {schedule.service.name}
                    </NativeSelectOption>
                  ) : null}
                  {services
                    .filter((s) => s.id !== schedule?.service.id)
                    .map((s) => (
                      <NativeSelectOption key={s.id} value={s.id}>
                        {s.name}
                      </NativeSelectOption>
                    ))}
                </NativeSelect>
                {errors.serviceId ? <FieldError>{errors.serviceId}</FieldError> : null}
              </Field>
              <Field data-invalid={errors.stageId ? true : undefined}>
                <FieldLabel htmlFor="schedule-stage">{t("meetings.fields.stage")}</FieldLabel>
                <NativeSelect
                  id="schedule-stage"
                  className="w-full"
                  value={d.stageId}
                  disabled={!!schedule}
                  aria-invalid={errors.stageId ? true : undefined}
                  onChange={(event) => set("stageId", event.target.value)}
                >
                  <NativeSelectOption value="">
                    {t("meetings.fields.wholeService")}
                  </NativeSelectOption>
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
                </NativeSelect>
                {errors.stageId ? <FieldError>{errors.stageId}</FieldError> : null}
              </Field>
            </div>
            <TextField
              label={t("meetings.fields.name")}
              value={d.name}
              onChange={(event) => set("name", event.target.value)}
              maxLength={120}
              placeholder={t("meetings.form.namePlaceholder")}
              description={t("meetings.form.nameHint")}
              error={errors.name}
            />
            <TextField
              label={t("meetings.fields.place")}
              optional
              value={d.location}
              onChange={(event) => set("location", event.target.value)}
              maxLength={120}
              placeholder={t("meetings.form.placePlaceholder")}
              error={errors.location}
            />
            <FieldSet>
              <FieldLegend>{t("meetings.fields.whoIsExpected")}</FieldLegend>
              <RadioGroup
                value={d.rosterMode}
                onValueChange={(value) => set("rosterMode", value as RosterMode)}
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
              error={errors.description}
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
                onValueChange={(value) => value && set("frequency", value as Draft["frequency"])}
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
                        intervalSelect(t("meetings.form.weeksInterval"), [1, 2, 3, 4]),
                    })}
                  </div>
                  <ToggleGroup
                    type="multiple"
                    variant="outline"
                    spacing={0}
                    value={d.weekdays.map(String)}
                    onValueChange={(value) => set("weekdays", value.map(Number) as IsoWeekday[])}
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
                          set("monthWeek", Number(event.target.value) as MonthWeek)
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
                          set("monthWeekday", Number(event.target.value) as IsoWeekday)
                        }
                      >
                        {WEEKDAYS.map((weekday) => (
                          <NativeSelectOption key={weekday} value={weekday}>
                            {f.weekdayName(weekday)}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    ),
                    interval: () => intervalSelect(t("meetings.form.monthsInterval"), [1, 2, 3, 6]),
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
                error={errors.startTime}
              />
              <TextField
                label={t("meetings.form.endsAt")}
                type="time"
                optional
                value={d.endTime}
                onChange={(event) => set("endTime", event.target.value)}
                error={errors.endTime}
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
      </div>

      <DialogFooter className="border-t px-6 py-4">
        <Button type="button" variant="outline" disabled={mutation.pending} onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={mutation.pending || preview.error !== null}>
          {mutation.pending ? <Spinner data-icon="inline-start" /> : null}
          {schedule ? t("meetings.form.save") : t("meetings.form.create")}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ScheduleDialog({
  today,
  schedule,
  fixedServiceId,
  open,
  onOpenChange,
}: {
  today: LocalDate
  schedule?: ScheduleSummary
  fixedServiceId?: Uuid
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations()
  const f = useFormat()
  const services = useQuery(servicesQuery)
  const manageable = services.data?.items.filter((s) => s.can.manageSessions && !s.archived) ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-4xl">
        <DialogHeader className="border-b p-6 pe-16">
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-4" />
            {schedule ? t("meetings.actions.edit") : t("meetings.form.newTitle")}
          </DialogTitle>
          <DialogDescription>
            {schedule
              ? `${groupOf(schedule)} · ${f.recurrence(recurrenceOf(schedule.recurrence))}`
              : t("meetings.form.newDescription")}
          </DialogDescription>
        </DialogHeader>
        {open && services.data ? (
          <ScheduleForm
            services={manageable}
            today={today}
            schedule={schedule}
            fixedServiceId={fixedServiceId}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
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
      <ScheduleDialog
        today={today}
        fixedServiceId={fixedServiceId}
        open={open}
        onOpenChange={setOpen}
      />
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
      <ScheduleDialog today={today} schedule={schedule} open={open} onOpenChange={setOpen} />
    </>
  )
}
