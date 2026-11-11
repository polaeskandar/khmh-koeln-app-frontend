import type { Metadata } from "next"

import { DataRequestPage } from "@/features/privacy/data-requests/data-request-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/data-requests/view">): Promise<Metadata> {
  return { title: await pageTitle(params, "dataRequest") }
}

export default async function Page({ params }: PageProps<"/[locale]/settings/data-requests/view">) {
  await pageLocale(params)

  return <DataRequestPage />
}
