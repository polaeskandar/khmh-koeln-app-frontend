import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SchedulesPage } from "@/features/meetings/meetings/schedules-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/meetings/schedules">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "meetings" })

  return { title: t("schedules.pageTitle") }
}

export default async function Page({ params }: PageProps<"/[locale]/meetings/schedules">) {
  await pageLocale(params)

  return <SchedulesPage />
}
