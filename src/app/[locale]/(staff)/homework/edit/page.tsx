import type { Metadata } from "next"

import { EditHomeworkPage } from "@/features/learning/homework/edit-homework-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/homework/edit">): Promise<Metadata> {
  return { title: await pageTitle(params, "editHomework") }
}

export default async function Page({ params }: PageProps<"/[locale]/homework/edit">) {
  await pageLocale(params)

  return <EditHomeworkPage />
}
