import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { NewHomeworkPage } from "@/features/learning/homework/new-homework-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/homework/new">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "homework" })

  return { title: t("newHomework") }
}

export default async function Page({ params }: PageProps<"/[locale]/homework/new">) {
  await pageLocale(params)

  return <NewHomeworkPage />
}
