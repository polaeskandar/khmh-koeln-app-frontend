import type { Metadata } from "next"

import { EditLessonPage } from "@/features/learning/lessons/edit-lesson-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/edit">): Promise<Metadata> {
  return { title: await pageTitle(params, "editLesson") }
}

export default async function Page({ params }: PageProps<"/[locale]/lessons/edit">) {
  await pageLocale(params)

  return <EditLessonPage />
}
