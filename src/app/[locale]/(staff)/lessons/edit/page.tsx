import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { EditLessonPage } from "@/features/lessons/lesson-editor"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/edit">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "lessons" })

  return { title: t("editLesson") }
}

export default async function Page({ params }: PageProps<"/[locale]/lessons/edit">) {
  await pageLocale(params)

  return <EditLessonPage />
}
