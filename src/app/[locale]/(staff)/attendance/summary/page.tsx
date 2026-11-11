import type { Metadata } from "next"

import { AttendanceSummaryPage } from "@/features/meetings/attendance/attendance-summary-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/attendance/summary">): Promise<Metadata> {
  return { title: await pageTitle(params, "attendanceSummary") }
}

export default async function Page({ params }: PageProps<"/[locale]/attendance/summary">) {
  await pageLocale(params)

  return <AttendanceSummaryPage />
}
