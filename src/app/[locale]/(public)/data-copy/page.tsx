import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { DataCopyPage } from "@/features/privacy/data-copy/data-copy-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/data-copy">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "privacy.copy" })

  return { title: t("title"), referrer: "no-referrer" }
}

export default async function Page({ params }: PageProps<"/[locale]/data-copy">) {
  await pageLocale(params)

  return <DataCopyPage />
}
