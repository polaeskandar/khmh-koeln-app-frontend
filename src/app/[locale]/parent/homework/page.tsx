import type { Metadata } from "next"

import { ParentHomeworkPage } from "@/features/learning/homework/parent-homework-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/parent/homework">): Promise<Metadata> {
  return { title: await pageTitle(params, "parentHomework") }
}

export default async function Page({ params }: PageProps<"/[locale]/parent/homework">) {
  await pageLocale(params)

  return <ParentHomeworkPage />
}
