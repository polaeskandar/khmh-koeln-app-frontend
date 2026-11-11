import type { Metadata } from "next"

import { HomeworkProgressPage } from "@/features/learning/homework/homework-progress-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/homework/view">): Promise<Metadata> {
  return { title: await pageTitle(params, "homework") }
}

export default async function Page({ params }: PageProps<"/[locale]/homework/view">) {
  await pageLocale(params)

  return <HomeworkProgressPage />
}
