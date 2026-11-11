import type { Metadata } from "next"

import { SchedulePage } from "@/features/meetings/meetings/schedule-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/meetings/schedules/view">): Promise<Metadata> {
  return { title: await pageTitle(params, "schedule") }
}

export default async function Page({ params }: PageProps<"/[locale]/meetings/schedules/view">) {
  await pageLocale(params)

  return <SchedulePage />
}
