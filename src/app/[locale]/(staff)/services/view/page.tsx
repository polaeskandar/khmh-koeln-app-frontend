import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ServiceDetailsPage } from "@/features/organization/services/service-details-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services/view">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "nav" })

  return { title: t("services") }
}

export default async function Page({ params }: PageProps<"/[locale]/services/view">) {
  await pageLocale(params)

  return <ServiceDetailsPage />
}
