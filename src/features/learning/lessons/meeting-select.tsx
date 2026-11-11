"use client"

import { useTranslations } from "next-intl"

import { FormField } from "@/components/form-fields"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useFormat } from "@/i18n/format"
import { isolate } from "@/lib/bidi"
import type { LocalDate } from "@/lib/api/types/common"
import { addDays } from "@/lib/domain/time"

import { type MeetingOption, OTHER_DATE, optionValue } from "./api"

export function MeetingSelect({
  options,
  today,
  value,
  saved,
  otherDate,
  onChange,
  onOtherDateChange,
  error,
}: {
  options: MeetingOption[]
  today: LocalDate
  value: string
  saved: string | null
  otherDate: LocalDate
  onChange: (value: string) => void
  onOtherDateChange: (date: LocalDate) => void
  error?: string
}) {
  const t = useTranslations("lessons")
  const f = useFormat()
  const selected = options.find((o) => optionValue(o) === value)

  const label = (o: MeetingOption) =>
    [
      t("editor.option.when", {
        day: o.date === today ? f.relativeDay(o.date, today) : f.dayMonth(o.date),
        time: o.startTime,
      }),
      o.title,
      o.state === "canceled"
        ? t("editor.option.canceled")
        : o.state === "completed"
          ? t("meeting.held")
          : null,
      o.takenBy && optionValue(o) !== saved
        ? t("editor.option.taken", { title: isolate(o.takenBy.title) })
        : null,
    ]
      .filter(Boolean)
      .join(" · ")

  const hint = () => {
    if (!selected) {
      return t("editor.hint.none")
    }

    switch (selected.state) {
      case "planned":
        return t("editor.hint.planned", { date: f.dayMonth(addDays(selected.date, -1)) })
      case "canceled":
        return t("editor.hint.canceled")
      case "completed":
        return t("editor.hint.completed")
      default:
        return selected.date === today ? t("editor.hint.today") : t("editor.hint.exists")
    }
  }

  return (
    <FormField label={t("editor.meeting")} description={hint()} error={error}>
      {(control) => (
        <>
          <NativeSelect
            {...control}
            className="w-full"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          >
            {options.map((o) => (
              <NativeSelectOption
                key={optionValue(o)}
                value={optionValue(o)}
                disabled={(!!o.takenBy || o.state === "canceled") && optionValue(o) !== saved}
              >
                {label(o)}
              </NativeSelectOption>
            ))}
            <NativeSelectOption value={OTHER_DATE}>{t("editor.otherDate")}</NativeSelectOption>
          </NativeSelect>
          {value === OTHER_DATE ? (
            <Input
              type="date"
              aria-label={t("fields.teachingDate")}
              value={otherDate}
              onChange={(event) => onOtherDateChange(event.target.value)}
              className="mt-2"
            />
          ) : null}
        </>
      )}
    </FormField>
  )
}
