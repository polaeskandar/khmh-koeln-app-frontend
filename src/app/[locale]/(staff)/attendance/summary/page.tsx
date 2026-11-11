import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AttendanceSummaryPage } from "@/features/meetings/attendance/attendance-summary-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/attendance/summary">): Promise<Metadata> {
  const t = await getTranslations({
    locale: await pageLocale(params),
    namespace: "attendance.summary",
  })

  return { title: t("metaTitle") }
}

export default async function Page({ params }: PageProps<"/[locale]/attendance/summary">) {
  await pageLocale(params)

  return <AttendanceSummaryPage />
}
