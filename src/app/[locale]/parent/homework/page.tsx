import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ParentHomeworkPage } from "@/features/learning/homework/parent-homework-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/parent/homework">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "parent.nav" })

  return { title: t("homework") }
}

export default async function Page({ params }: PageProps<"/[locale]/parent/homework">) {
  await pageLocale(params)

  return <ParentHomeworkPage />
}
