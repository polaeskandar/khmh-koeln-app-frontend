import type { Metadata } from "next"

import { SchedulesPage } from "@/features/meetings/meetings/schedules-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/meetings/schedules">): Promise<Metadata> {
  return { title: await pageTitle(params, "schedules") }
}

export default async function Page({ params }: PageProps<"/[locale]/meetings/schedules">) {
  await pageLocale(params)

  return <SchedulesPage />
}
