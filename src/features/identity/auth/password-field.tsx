"use client"

import { Eye, EyeOff } from "lucide-react"
import { useTranslations } from "next-intl"
import { type ComponentProps, type ReactNode, useState } from "react"

import { FormField } from "@/components/form-fields"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

export function PasswordField({
  label,
  description,
  error,
  labelExtra,
  ...props
}: ComponentProps<typeof InputGroupInput> & {
  label: string
  description?: ReactNode
  error?: string
  labelExtra?: ReactNode
}) {
  const t = useTranslations("auth.password")
  const [visible, setVisible] = useState(false)

  return (
    <FormField label={label} description={description} error={error} labelExtra={labelExtra}>
      {(control) => (
        <InputGroup>
          <InputGroupInput {...control} type={visible ? "text" : "password"} dir="ltr" {...props} />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label={visible ? t("hide") : t("show")}
              aria-pressed={visible}
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? <EyeOff /> : <Eye />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      )}
    </FormField>
  )
}
