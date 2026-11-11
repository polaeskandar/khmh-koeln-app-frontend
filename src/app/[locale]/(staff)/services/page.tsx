import type { Metadata } from "next"

import { ServicesOverviewPage } from "@/features/organization/services/services-overview-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services">): Promise<Metadata> {
  return { title: await pageTitle(params, "services") }
}

export default async function Page({ params }: PageProps<"/[locale]/services">) {
  await pageLocale(params)

  return <ServicesOverviewPage />
}
