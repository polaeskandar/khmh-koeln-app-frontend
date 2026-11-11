import type { Metadata } from "next"

import { DataRequestsPage } from "@/features/privacy/data-requests/data-requests-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/data-requests">): Promise<Metadata> {
  return { title: await pageTitle(params, "dataRequests") }
}

export default async function Page({ params }: PageProps<"/[locale]/settings/data-requests">) {
  await pageLocale(params)

  return <DataRequestsPage />
}
