import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { LessonPage } from "@/features/lessons/lesson-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/view">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "lessons" })

  return { title: t("lesson") }
}

export default async function Page({ params }: PageProps<"/[locale]/lessons/view">) {
  await pageLocale(params)

  return <LessonPage />
}
