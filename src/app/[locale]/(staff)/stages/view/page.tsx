import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { StageOverview } from "@/features/stages/stage-layout"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/stages/view">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "stages" })

  return { title: t("kind") }
}

export default async function Page({ params }: PageProps<"/[locale]/stages/view">) {
  await pageLocale(params)

  return <StageOverview />
}
