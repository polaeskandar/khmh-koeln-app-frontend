import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { MembersPage } from "@/features/members/members-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/members">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "nav" })

  return { title: t("members") }
}

export default async function Page({ params }: PageProps<"/[locale]/members">) {
  await pageLocale(params)

  return <MembersPage />
}
