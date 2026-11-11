import type { Metadata } from "next"

import { ServiceDetailsPage } from "@/features/organization/services/service-details-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services/view">): Promise<Metadata> {
  return { title: await pageTitle(params, "service") }
}

export default async function Page({ params }: PageProps<"/[locale]/services/view">) {
  await pageLocale(params)

  return <ServiceDetailsPage />
}
