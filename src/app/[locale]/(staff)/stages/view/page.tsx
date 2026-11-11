import type { Metadata } from "next"

import { StagePage } from "@/features/organization/stages/stage-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/stages/view">): Promise<Metadata> {
  return { title: await pageTitle(params, "stage") }
}

export default async function Page({ params }: PageProps<"/[locale]/stages/view">) {
  await pageLocale(params)

  return <StagePage />
}
