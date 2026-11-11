import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { HomeworkProgressPage } from "@/features/learning/homework/homework-progress-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/homework/view">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "homework" })

  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/homework/view">) {
  await pageLocale(params)

  return <HomeworkProgressPage />
}
