import { useLocale } from "next-intl"

import { type Format, formatFor } from "@/lib/format"

export function useFormat(): Format {
  return formatFor(useLocale())
}
