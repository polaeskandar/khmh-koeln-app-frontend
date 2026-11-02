import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AgendaPage } from "@/features/meetings/agenda-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/meetings">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "nav" })

  return { title: t("meetings") }
}

export default async function Page({ params }: PageProps<"/[locale]/meetings">) {
  await pageLocale(params)

  return <AgendaPage />
}
