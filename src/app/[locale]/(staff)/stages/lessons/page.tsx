import type { Metadata } from "next"

import { StageLessonsPage } from "@/features/learning/lessons/stage-lessons-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/stages/lessons">): Promise<Metadata> {
  return { title: await pageTitle(params, "stageLessons") }
}

export default async function Page({ params }: PageProps<"/[locale]/stages/lessons">) {
  await pageLocale(params)

  return <StageLessonsPage />
}
