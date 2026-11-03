import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SchedulePage } from "@/features/meetings/schedule-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/meetings/schedules/view">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "meetings" })

  return { title: t("schedule.pageTitle") }
}

export default async function Page({ params }: PageProps<"/[locale]/meetings/schedules/view">) {
  await pageLocale(params)

  return <SchedulePage />
}
