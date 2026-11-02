import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { TakeAttendancePage } from "@/features/attendance/take-attendance-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/attendance/take">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "nav" })

  return { title: t("takeAttendance") }
}

export default async function Page({ params }: PageProps<"/[locale]/attendance/take">) {
  await pageLocale(params)

  return <TakeAttendancePage />
}
