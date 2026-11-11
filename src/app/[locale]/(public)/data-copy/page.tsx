import type { Metadata } from "next"

import { DataCopyPage } from "@/features/privacy/data-copy/data-copy-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/data-copy">): Promise<Metadata> {
  return { title: await pageTitle(params, "dataCopy"), referrer: "no-referrer" }
}

export default async function Page({ params }: PageProps<"/[locale]/data-copy">) {
  await pageLocale(params)

  return <DataCopyPage />
}
