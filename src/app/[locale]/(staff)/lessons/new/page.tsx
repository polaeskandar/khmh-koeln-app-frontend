import type { Metadata } from "next"

import { NewLessonPage } from "@/features/learning/lessons/new-lesson-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/new">): Promise<Metadata> {
  return { title: await pageTitle(params, "newLesson") }
}

export default async function Page({ params }: PageProps<"/[locale]/lessons/new">) {
  await pageLocale(params)

  return <NewLessonPage />
}
