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
import { isLocale, LOCALE_NAMES, LOCALES } from "@/i18n/config"
import { useSwitchLocale } from "@/i18n/use-switch-locale"

function LanguageChoices() {
  const locale = useLocale()
  const switchLocale = useSwitchLocale()

  return (
    <DropdownMenuRadioGroup
      value={locale}
      onValueChange={(value) => isLocale(value) && value !== locale && switchLocale(value)}
    >
      {LOCALES.map((l) => (
        <DropdownMenuRadioItem key={l} value={l} lang={l} className="normal-case">
          {LOCALE_NAMES[l]}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )
}

export function LanguageMenu() {
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
        <LanguageChoices />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function LanguageSubmenu() {
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
        <LanguageChoices />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
