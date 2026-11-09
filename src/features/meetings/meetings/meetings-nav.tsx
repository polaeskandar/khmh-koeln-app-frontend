"use client"

import { useTranslations } from "next-intl"

import { LinkTabs } from "@/components/link-tabs"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useRouter } from "@/i18n/navigation"
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

export function withQuery(path: string, query: Record<string, string | null | undefined>) {
  const params = new URLSearchParams()

  for (const [name, value] of Object.entries(query)) {
    if (value) {
      params.set(name, value)
    }
  }

  const search = params.toString()

  return search ? `${path}?${search}` : path
}

export function ServiceFilter({
  services,
  value,
  path,
  query = {},
}: {
  services: { id: string; name: string }[]
  value: string | null
  path: string
  query?: Record<string, string | null | undefined>
}) {
  const router = useRouter()
  const t = useTranslations("meetings")

  return (
    <NativeSelect
      aria-label={t("fields.service")}
      className="w-full sm:w-56"
      value={value ?? ""}
      onChange={(event) =>
        router.push(withQuery(path, { ...query, service: event.target.value || null }))
      }
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
