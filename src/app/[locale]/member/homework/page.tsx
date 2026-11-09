import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { MemberHomework } from "@/features/learning/homework/member-homework"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/member/homework">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "member.nav" })

  return { title: t("homework") }
}

export default async function Page({ params }: PageProps<"/[locale]/member/homework">) {
  await pageLocale(params)

  return <MemberHomework />
}
