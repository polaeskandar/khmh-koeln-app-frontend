import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { RolePage } from "@/features/identity/settings/role-editor"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/roles/view">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "roleEditor" })

  return { title: t("roles") }
}

export default async function Page({ params }: PageProps<"/[locale]/settings/roles/view">) {
  await pageLocale(params)

  return <RolePage />
}
