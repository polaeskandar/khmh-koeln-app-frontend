import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SessionPage } from "@/features/meetings/session-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/meetings/sessions/view">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "meetings" })

  return { title: t("session.pageTitle") }
}

export default async function Page({ params }: PageProps<"/[locale]/meetings/sessions/view">) {
  await pageLocale(params)

  return <SessionPage />
}
