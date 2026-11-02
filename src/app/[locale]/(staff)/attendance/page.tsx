import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AttendanceOverview } from "@/features/attendance/attendance-overview"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/attendance">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "nav" })

  return { title: t("attendance") }
}

export default async function Page({ params }: PageProps<"/[locale]/attendance">) {
  await pageLocale(params)

  return <AttendanceOverview />
}
