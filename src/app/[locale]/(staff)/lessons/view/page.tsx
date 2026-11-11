import type { Metadata } from "next"

import { LessonPage } from "@/features/learning/lessons/lesson-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/view">): Promise<Metadata> {
  return { title: await pageTitle(params, "lesson") }
}

export default async function Page({ params }: PageProps<"/[locale]/lessons/view">) {
  await pageLocale(params)

  return <LessonPage />
}
