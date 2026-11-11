import type { Metadata } from "next"

import { AttendanceOverviewPage } from "@/features/meetings/attendance/attendance-overview-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/attendance">): Promise<Metadata> {
  return { title: await pageTitle(params, "attendance") }
}

export default async function Page({ params }: PageProps<"/[locale]/attendance">) {
  await pageLocale(params)

  return <AttendanceOverviewPage />
}
