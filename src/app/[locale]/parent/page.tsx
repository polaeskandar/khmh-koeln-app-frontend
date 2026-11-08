import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ParentHome } from "@/features/learning/parent/parent-home"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/parent">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "parent.nav" })

  return { title: t("home") }
}

export default async function Page({ params }: PageProps<"/[locale]/parent">) {
  await pageLocale(params)

  return <ParentHome />
}
