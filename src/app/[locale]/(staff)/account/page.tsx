import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AccountPage } from "@/features/account/account-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "account" })

  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/account">) {
  await pageLocale(params)

  return <AccountPage />
}
