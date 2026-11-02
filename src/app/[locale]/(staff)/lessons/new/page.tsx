import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { NewLessonPage } from "@/features/lessons/lesson-editor"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/new">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "lessons" })

  return { title: t("newLesson") }
}

export default async function Page({ params }: PageProps<"/[locale]/lessons/new">) {
  await pageLocale(params)

  return <NewLessonPage />
}
