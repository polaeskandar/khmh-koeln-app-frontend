import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { StagesManager } from "@/features/stages/stages-manager"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services/stages">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "stages" })

  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/services/stages">) {
  await pageLocale(params)

  return <StagesManager />
}
