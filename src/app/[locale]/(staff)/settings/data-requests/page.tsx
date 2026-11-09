import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { DataRequestsPage } from "@/features/privacy/data-requests/data-requests-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/data-requests">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "privacy.list" })

  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/settings/data-requests">) {
  await pageLocale(params)

  return <DataRequestsPage />
}
