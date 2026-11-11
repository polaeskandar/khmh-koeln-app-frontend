"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useId } from "react"
import { useTranslations } from "next-intl"

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
import { FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useInBrowser } from "@/hooks/use-in-browser"
import { oneOf } from "@/lib/one-of"

const THEMES = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const

type Theme = (typeof THEMES)[number]["value"]

const THEME_VALUES = THEMES.map((option) => option.value)

function useChosenTheme(): { theme: Theme; setTheme: (theme: string) => void } {
  const { theme, setTheme } = useTheme()

  const mounted = useInBrowser()

  const known = oneOf(THEME_VALUES, theme)

  return { theme: mounted && known ? known : "system", setTheme }
}

function ThemeChoices() {
  const t = useTranslations("prefs")
  const { theme, setTheme } = useChosenTheme()

  return (
    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
      {THEMES.map(({ value, icon: Icon }) => (
        <DropdownMenuRadioItem key={value} value={value}>
          <Icon />
          {t(value)}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )
}

export function AppearanceSubmenu() {
  const t = useTranslations("prefs")
  const { theme } = useChosenTheme()
  const Icon = THEMES.find((choice) => choice.value === theme)!.icon

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Icon />
        {t("appearance")}
        <span className="ms-auto ps-3 text-xs font-normal tracking-normal text-muted-foreground normal-case">
          {t(theme)}
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <ThemeChoices />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

export function AppearanceMenu() {
  const t = useTranslations("prefs")
  const { theme } = useChosenTheme()
  const Icon = THEMES.find((choice) => choice.value === theme)!.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("appearance")}>
          <Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ThemeChoices />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppearanceFields() {
  const t = useTranslations("prefs")
  const { theme, setTheme } = useChosenTheme()
  const id = useId()

  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-3">
      <span id={id} className="text-sm font-medium">
        {t("appearance")}
      </span>
      <RadioGroup value={theme} onValueChange={setTheme} className="flex flex-wrap gap-4">
        {THEMES.map(({ value }) => (
          <span key={value} className="flex items-center gap-2">
            <RadioGroupItem id={`${id}-${value}`} value={value} />
            <FieldLabel htmlFor={`${id}-${value}`} className="font-normal">
              {t(value)}
            </FieldLabel>
          </span>
        ))}
      </RadioGroup>
    </div>
  )
}
