import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ErasureScheduledPage } from "@/features/identity/auth/erasure-scheduled-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-in/erasure-scheduled">): Promise<Metadata> {
  const t = await getTranslations({
    locale: await pageLocale(params),
    namespace: "auth.erasureScheduled",
  })

  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/sign-in/erasure-scheduled">) {
  await pageLocale(params)

  return <ErasureScheduledPage />
}
