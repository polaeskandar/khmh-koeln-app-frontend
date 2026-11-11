"use client"

import { useTranslations } from "next-intl"

import { NotFoundState } from "@/components/page-states"
import { routes } from "@/lib/routes"

import { Topbar } from "./topbar"

const AREAS = {
  services: routes.services,
  meetings: routes.meetings,
  attendance: routes.attendance,
  settings: routes.settings,
}

export function RecordNotFound({ area, home }: { area: keyof typeof AREAS; home?: string }) {
  const t = useTranslations("nav")
  const areaHome = AREAS[area]()

  return (
    <>
      <Topbar crumbs={[{ label: t(area), href: areaHome }]} />
      <NotFoundState home={home ?? areaHome} />
    </>
  )
}
