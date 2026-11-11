"use client"

import { useTranslations } from "next-intl"

import { LinkTabs } from "@/components/link-tabs"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useRouter } from "@/i18n/navigation"
import type { Uuid } from "@/lib/api/types/common"
import { routes } from "@/lib/routes"

export function MeetingsTabs({ active }: { active: "sessions" | "schedules" }) {
  const t = useTranslations()

  return (
    <LinkTabs
      label={t("nav.meetings")}
      active={active}
      items={[
        { key: "sessions", label: t("meetings.tabs.sessions"), href: routes.meetings() },
        { key: "schedules", label: t("meetings.tabs.schedules"), href: routes.schedules() },
      ]}
    />
  )
}

export function ServiceFilter({
  services,
  value,
  hrefFor,
}: {
  services: { id: string; name: string }[]
  value: string | null
  hrefFor: (serviceId: Uuid | null) => string
}) {
  const router = useRouter()
  const t = useTranslations("meetings")

  return (
    <NativeSelect
      aria-label={t("fields.service")}
      className="w-full sm:w-56"
      value={value ?? ""}
      onChange={(event) => router.push(hrefFor(event.target.value || null))}
    >
      <NativeSelectOption value="">{t("filter.allServices")}</NativeSelectOption>
      {services.map((service) => (
        <NativeSelectOption key={service.id} value={service.id}>
          {service.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
