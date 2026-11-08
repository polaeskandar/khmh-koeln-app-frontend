import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ServiceDetails } from "@/features/organization/services/service-details"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services/view">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "nav" })

  return { title: t("services") }
}

export default async function Page({ params }: PageProps<"/[locale]/services/view">) {
  await pageLocale(params)

  return <ServiceDetails />
}
