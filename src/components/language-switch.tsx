"use client"

import { ChevronDown, Languages } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { isLocale, type Locale, LOCALE_NAMES, LOCALES } from "@/i18n/config"

type SwitchProps = { onSwitch: (locale: Locale) => void }

function LanguageChoices({ onSwitch }: SwitchProps) {
  const locale = useLocale()

  return (
    <DropdownMenuRadioGroup
      value={locale}
      onValueChange={(value) => isLocale(value) && value !== locale && onSwitch(value)}
    >
      {LOCALES.map((l) => (
        <DropdownMenuRadioItem key={l} value={l} lang={l} className="normal-case">
          {LOCALE_NAMES[l]}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )
}

export function LanguageMenu({ onSwitch }: SwitchProps) {
  const t = useTranslations("prefs")
  const locale = useLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("language")}>
          <Languages data-icon="inline-start" />
          <span className="normal-case" lang={locale}>
            {LOCALE_NAMES[locale]}
          </span>
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <LanguageChoices onSwitch={onSwitch} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function LanguageSubmenu({ onSwitch }: SwitchProps) {
  const t = useTranslations("prefs")
  const locale = useLocale()

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages />
        {t("language")}
        <span
          lang={locale}
          className="ms-auto ps-3 text-xs font-normal tracking-normal text-muted-foreground normal-case"
        >
          {LOCALE_NAMES[locale]}
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <LanguageChoices onSwitch={onSwitch} />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
