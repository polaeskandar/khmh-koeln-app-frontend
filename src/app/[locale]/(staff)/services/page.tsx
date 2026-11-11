import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ServicesOverviewPage } from "@/features/organization/services/services-overview-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "nav" })

  return { title: t("services") }
}

export default async function Page({ params }: PageProps<"/[locale]/services">) {
  await pageLocale(params)

  return <ServicesOverviewPage />
}
