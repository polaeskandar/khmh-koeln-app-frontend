import type { Metadata } from "next"

import { StagesManagerPage } from "@/features/organization/stages/stages-manager-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services/stages">): Promise<Metadata> {
  return { title: await pageTitle(params, "serviceStages") }
}

export default async function Page({ params }: PageProps<"/[locale]/services/stages">) {
  await pageLocale(params)

  return <StagesManagerPage />
}
