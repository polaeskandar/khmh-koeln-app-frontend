import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { DataRequestPage } from "@/features/privacy/data-request-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/data-requests/view">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "privacy.list" })

  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/settings/data-requests/view">) {
  await pageLocale(params)

  return <DataRequestPage />
}
