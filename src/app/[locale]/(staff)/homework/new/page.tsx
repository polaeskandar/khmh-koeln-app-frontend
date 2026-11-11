import type { Metadata } from "next"

import { NewHomeworkPage } from "@/features/learning/homework/new-homework-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/homework/new">): Promise<Metadata> {
  return { title: await pageTitle(params, "newHomework") }
}

export default async function Page({ params }: PageProps<"/[locale]/homework/new">) {
  await pageLocale(params)

  return <NewHomeworkPage />
}
