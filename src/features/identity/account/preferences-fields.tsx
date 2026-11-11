"use client"

import { useLocale, useTranslations } from "next-intl"
import { useId } from "react"

import { FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AppearanceFields } from "@/components/theme-switch"
import { isLocale, LOCALE_NAMES, LOCALES } from "@/i18n/config"
import { useSwitchLocale } from "@/features/identity/auth/use-switch-locale"

function LanguageFields() {
  const t = useTranslations("prefs")
  const locale = useLocale()
  const switchLocale = useSwitchLocale()
  const id = useId()

  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-3">
      <span id={id} className="text-sm font-medium">
        {t("language")}
      </span>
      <RadioGroup
        value={locale}
        onValueChange={(value) => isLocale(value) && value !== locale && switchLocale(value)}
        className="flex flex-wrap gap-4"
      >
        {LOCALES.map((l) => (
          <span key={l} className="flex items-center gap-2">
            <RadioGroupItem id={`${id}-${l}`} value={l} />
            <FieldLabel htmlFor={`${id}-${l}`} lang={l} className="font-normal">
              {LOCALE_NAMES[l]}
            </FieldLabel>
          </span>
        ))}
      </RadioGroup>
    </div>
  )
}

export function PreferencesFields() {
  return (
    <div className="flex flex-col gap-6">
      <LanguageFields />
      <AppearanceFields />
    </div>
  )
}
