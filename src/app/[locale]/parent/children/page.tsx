import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ParentChildren } from "@/features/parent/parent-children"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/parent/children">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "parent.nav" })

  return { title: t("children") }
}

export default async function Page({ params }: PageProps<"/[locale]/parent/children">) {
  await pageLocale(params)

  return <ParentChildren />
}
