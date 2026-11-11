import type { Metadata } from "next"

import { MemberAccountPage } from "@/features/portals/member/member-account-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/member/account">): Promise<Metadata> {
  return { title: await pageTitle(params, "memberAccount") }
}

export default async function Page({ params }: PageProps<"/[locale]/member/account">) {
  await pageLocale(params)

  return <MemberAccountPage />
}
