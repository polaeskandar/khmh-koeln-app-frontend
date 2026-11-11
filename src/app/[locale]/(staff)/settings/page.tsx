import type { Metadata } from "next"

import { SettingsPage } from "@/features/identity/accounts/settings-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings">): Promise<Metadata> {
  return { title: await pageTitle(params, "settings") }
}

export default async function Page({ params }: PageProps<"/[locale]/settings">) {
  await pageLocale(params)

  return <SettingsPage />
}
