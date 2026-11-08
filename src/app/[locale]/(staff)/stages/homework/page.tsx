import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { StageHomeworkPage } from "@/features/learning/homework/stage-homework"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/stages/homework">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "homework" })

  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/stages/homework">) {
  await pageLocale(params)

  return <StageHomeworkPage />
}
