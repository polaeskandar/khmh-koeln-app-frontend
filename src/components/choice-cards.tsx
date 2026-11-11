"use client"

import { type ReactNode, useId } from "react"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

type Choice<T extends string> = { value: T; label: ReactNode; hint?: ReactNode }

export function ChoiceCards<T extends string>({
  value,
  choices,
  onChange,
  disabled = false,
  className = "flex flex-col gap-2",
  "aria-label": ariaLabel,
}: {
  value: T | null
  choices: readonly Choice<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  className?: string
  "aria-label"?: string
}) {
  const id = useId()

  function choose(next: string) {
    const chosen = choices.find((choice) => choice.value === next)

    if (chosen) {
      onChange(chosen.value)
    }
  }

  return (
    <RadioGroup
      value={value ?? ""}
      onValueChange={choose}
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
    >
      {choices.map((choice) => (
        <label
          key={choice.value}
          htmlFor={`${id}-${choice.value}`}
          className={cn(
            "flex w-full items-start gap-3 border p-3 text-sm",
            value === choice.value && "border-primary bg-primary/5",
            disabled ? "cursor-default" : "cursor-pointer"
          )}
        >
          <RadioGroupItem id={`${id}-${choice.value}`} value={choice.value} className="mt-0.5" />
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">{choice.label}</span>
            {choice.hint ? (
              <span className="text-xs text-pretty text-muted-foreground">{choice.hint}</span>
            ) : null}
          </span>
        </label>
      ))}
    </RadioGroup>
  )
}
