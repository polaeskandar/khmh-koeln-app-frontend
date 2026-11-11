import type { Metadata } from "next"

import { StageHomeworkPage } from "@/features/learning/homework/stage-homework-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/stages/homework">): Promise<Metadata> {
  return { title: await pageTitle(params, "stageHomework") }
}

export default async function Page({ params }: PageProps<"/[locale]/stages/homework">) {
  await pageLocale(params)

  return <StageHomeworkPage />
}
