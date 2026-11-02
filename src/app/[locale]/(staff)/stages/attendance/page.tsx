import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { StageAttendance } from "@/features/stages/stage-attendance"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/stages/attendance">): Promise<Metadata> {
  const t = await getTranslations({
    locale: await pageLocale(params),
    namespace: "attendance.stage",
  })

  return { title: t("metaTitle") }
}

export default async function Page({ params }: PageProps<"/[locale]/stages/attendance">) {
  await pageLocale(params)

  return <StageAttendance />
}
