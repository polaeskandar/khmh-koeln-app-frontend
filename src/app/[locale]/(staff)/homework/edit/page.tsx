import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { EditHomeworkPage } from "@/features/learning/homework/edit-homework-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/homework/edit">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "homework" })

  return { title: t("editHomework") }
}

export default async function Page({ params }: PageProps<"/[locale]/homework/edit">) {
  await pageLocale(params)

  return <EditHomeworkPage />
}
