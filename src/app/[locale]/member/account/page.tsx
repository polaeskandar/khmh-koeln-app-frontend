import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { MemberAccount } from "@/features/people/member/member-account"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/member/account">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "member.nav" })

  return { title: t("account") }
}

export default async function Page({ params }: PageProps<"/[locale]/member/account">) {
  await pageLocale(params)

  return <MemberAccount />
}
