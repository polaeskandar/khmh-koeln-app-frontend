import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { StageLessonsPage } from "@/features/learning/lessons/stage-lessons-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/stages/lessons">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "lessons" })

  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/stages/lessons">) {
  await pageLocale(params)

  return <StageLessonsPage />
}
