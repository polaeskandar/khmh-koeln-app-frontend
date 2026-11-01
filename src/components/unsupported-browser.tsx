"use client"

import { TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { useSyncExternalStore } from "react"

const supported = () => CSS.supports("color", "color-mix(in oklch, white, black)")
const subscribe = () => () => {}

export function UnsupportedBrowser() {
  const t = useTranslations("common")
  const ok = useSyncExternalStore(subscribe, supported, () => true)

  if (ok) {
    return null
  }

  return (
    <p role="alert" className="flex items-center gap-2 bg-warning-soft p-3 text-sm text-warning">
      <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
      {t("unsupportedBrowser")}
    </p>
  )
}
