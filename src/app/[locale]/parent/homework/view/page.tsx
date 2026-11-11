import type { Metadata } from "next"

import { ParentTaskPage } from "@/features/learning/homework/parent-task-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/parent/homework/view">): Promise<Metadata> {
  return { title: await pageTitle(params, "parentHomeworkTask") }
}

export default async function Page({ params }: PageProps<"/[locale]/parent/homework/view">) {
  await pageLocale(params)

  return <ParentTaskPage />
}
