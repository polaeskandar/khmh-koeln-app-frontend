import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { MemberHome } from "@/features/people/member/member-home"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/member">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "member.nav" })

  return { title: t("home") }
}

export default async function Page({ params }: PageProps<"/[locale]/member">) {
  await pageLocale(params)

  return <MemberHome />
}
