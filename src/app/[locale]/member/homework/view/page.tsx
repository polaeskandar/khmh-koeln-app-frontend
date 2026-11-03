import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { MemberTaskPage } from "@/features/member/member-task"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/member/homework/view">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "member.nav" })

  return { title: t("homework") }
}

export default async function Page({ params }: PageProps<"/[locale]/member/homework/view">) {
  await pageLocale(params)

  return <MemberTaskPage />
}
