"use client"

import { cn } from "cn"
import { useTranslations } from "next-intl"

import { FieldError, FieldLegend, FieldSet } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useFormat } from "@/i18n/format"
import type { Frequency } from "./api"
import { ISO_WEEKDAYS, MONTH_WEEKS } from "@/lib/domain/recurrence"
import { oneOf } from "@/lib/one-of"

import { type DraftFieldsProps, INTERVALS, withFrequency } from "./schedule-draft"

const FREQUENCIES: Frequency[] = ["weekly", "monthly"]

const RECURRENCE_FIELDS = ["recurrence.interval", "recurrence.weekdays", "recurrence.monthWeek"]

const SELECTED =
  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"

function IntervalSelect({
  label,
  frequency,
  draft,
  onChange,
}: Omit<DraftFieldsProps, "errors"> & { label: string; frequency: Frequency }) {
  return (
    <NativeSelect
      aria-label={label}
      className="w-16"
      value={String(draft.interval)}
      onChange={(event) => onChange({ interval: Number(event.target.value) })}
    >
      {INTERVALS[frequency].map((n) => (
        <NativeSelectOption key={n} value={n}>
          {n}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}

function WeeklyFields({ draft, errors, onChange }: DraftFieldsProps) {
  const t = useTranslations("meetings.form")
  const f = useFormat()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {t.rich("everyWeeks", {
          count: draft.interval,
          interval: () => (
            <IntervalSelect
              label={t("weeksInterval")}
              frequency="weekly"
              draft={draft}
              onChange={onChange}
            />
          ),
        })}
      </div>
      <ToggleGroup
        type="multiple"
        variant="outline"
        spacing={0}
        value={draft.weekdays.map(String)}
        onValueChange={(value) =>
          onChange({ weekdays: value.flatMap((day) => oneOf(ISO_WEEKDAYS, Number(day)) ?? []) })
        }
        aria-label={t("weekdays")}
        aria-invalid={errors["recurrence.weekdays"] ? true : undefined}
        className="flex-wrap"
      >
        {ISO_WEEKDAYS.map((weekday) => (
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
  )
}

function MonthlyFields({ draft, onChange }: Omit<DraftFieldsProps, "errors">) {
  const t = useTranslations("meetings.form")
  const f = useFormat()

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {t.rich("monthlyOn", {
        count: draft.interval,
        week: () => (
          <NativeSelect
            aria-label={t("monthWeek")}
            className="w-24"
            value={String(draft.monthWeek)}
            onChange={(event) =>
              onChange({
                monthWeek: oneOf(MONTH_WEEKS, Number(event.target.value)) ?? draft.monthWeek,
              })
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
            aria-label={t("weekday")}
            className="w-32"
            value={String(draft.monthWeekday)}
            onChange={(event) =>
              onChange({
                monthWeekday: oneOf(ISO_WEEKDAYS, Number(event.target.value)) ?? draft.monthWeekday,
              })
            }
          >
            {ISO_WEEKDAYS.map((weekday) => (
              <NativeSelectOption key={weekday} value={weekday}>
                {f.weekdayName(weekday)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ),
        interval: () => (
          <IntervalSelect
            label={t("monthsInterval")}
            frequency="monthly"
            draft={draft}
            onChange={onChange}
          />
        ),
      })}
    </div>
  )
}

export function RecurrenceFields({ draft, errors, onChange }: DraftFieldsProps) {
  const t = useTranslations("meetings")
  const recurrenceError = RECURRENCE_FIELDS.map((field) => errors[field]).find(Boolean)

  return (
    <FieldSet data-invalid={recurrenceError ? true : undefined}>
      <FieldLegend>{t("schedule.repeats")}</FieldLegend>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        value={draft.frequency}
        onValueChange={(value) => {
          const frequency = oneOf(FREQUENCIES, value)

          if (frequency) {
            onChange(withFrequency(draft, frequency))
          }
        }}
        aria-label={t("form.frequency")}
      >
        <ToggleGroupItem value="weekly" className={SELECTED}>
          {t("form.weekly")}
        </ToggleGroupItem>
        <ToggleGroupItem value="monthly" className={SELECTED}>
          {t("form.monthly")}
        </ToggleGroupItem>
      </ToggleGroup>
      {draft.frequency === "weekly" ? (
        <WeeklyFields draft={draft} errors={errors} onChange={onChange} />
      ) : (
        <MonthlyFields draft={draft} onChange={onChange} />
      )}
      {recurrenceError ? <FieldError>{recurrenceError}</FieldError> : null}
    </FieldSet>
  )
}
