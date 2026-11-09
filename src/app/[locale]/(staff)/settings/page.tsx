import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SettingsPage } from "@/features/identity/accounts/settings-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "nav" })

  return { title: t("settings") }
}

export default async function Page({ params }: PageProps<"/[locale]/settings">) {
  await pageLocale(params)

  return <SettingsPage />
}
