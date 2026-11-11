import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { NewRolePage } from "@/features/identity/roles/new-role-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/roles/new">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "roleEditor" })

  return { title: t("titleNew") }
}

export default async function Page({ params }: PageProps<"/[locale]/settings/roles/new">) {
  await pageLocale(params)

  return <NewRolePage />
}
