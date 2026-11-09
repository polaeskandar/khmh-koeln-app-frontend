import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ParentAccount } from "@/features/portals/parent/parent-account"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/parent/account">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "parent.nav" })

  return { title: t("account") }
}

export default async function Page({ params }: PageProps<"/[locale]/parent/account">) {
  await pageLocale(params)

  return <ParentAccount />
}
