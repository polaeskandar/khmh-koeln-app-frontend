"use client"

import { type ComponentProps, type ReactNode, useId } from "react"
import { useTranslations } from "next-intl"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"

export function OptionalNote() {
  const t = useTranslations("common")

  return (
    <>
      {" "}
      <span className="font-normal text-muted-foreground">{t("optionalNote")}</span>
    </>
  )
}

export type FieldControl = {
  id: string
  "aria-invalid": true | undefined
  "aria-describedby": string | undefined
}

type FieldTexts = {
  label: string
  description?: ReactNode
  error?: string
  optional?: boolean
}

export function FormField({
  label,
  hideLabel = false,
  description,
  error,
  optional,
  labelExtra,
  className,
  id: suppliedId,
  children,
}: FieldTexts & {
  hideLabel?: boolean
  labelExtra?: ReactNode
  className?: string
  id?: string
  children: (control: FieldControl) => ReactNode
}) {
  const generatedId = useId()
  const id = suppliedId ?? generatedId
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const describedBy = () => {
    if (error) {
      return errorId
    }

    return description ? hintId : undefined
  }

  const fieldLabel = (
    <FieldLabel htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
      {label}
      {optional ? <OptionalNote /> : null}
    </FieldLabel>
  )

  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      {labelExtra ? (
        <div className="flex items-baseline justify-between gap-3">
          {fieldLabel}
          {labelExtra}
        </div>
      ) : (
        fieldLabel
      )}
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy(),
      })}
      {description && !error ? (
        <FieldDescription id={hintId}>{description}</FieldDescription>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </Field>
  )
}

export function TextField({
  label,
  description,
  error,
  optional,
  className,
  id,
  ...props
}: ComponentProps<typeof Input> & FieldTexts) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      optional={optional}
      className={className}
      id={id}
    >
      {(control) => <Input {...control} {...props} />}
    </FormField>
  )
}

export function TextAreaField({
  label,
  description,
  error,
  optional,
  className,
  id,
  ...props
}: ComponentProps<typeof Textarea> & FieldTexts) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      optional={optional}
      className={className}
      id={id}
    >
      {(control) => <Textarea {...control} {...props} />}
    </FormField>
  )
}

export function SelectField({
  label,
  description,
  error,
  optional,
  className,
  id,
  children,
  ...props
}: ComponentProps<typeof NativeSelect> & FieldTexts) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      optional={optional}
      className={className}
      id={id}
    >
      {(control) => (
        <NativeSelect className="w-full" {...control} {...props}>
          {children}
        </NativeSelect>
      )}
    </FormField>
  )
}
