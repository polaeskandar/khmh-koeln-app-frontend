import type { Metadata } from "next"

import { MemberHomePage } from "@/features/portals/member/member-home-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/member">): Promise<Metadata> {
  return { title: await pageTitle(params, "memberHome") }
}

export default async function Page({ params }: PageProps<"/[locale]/member">) {
  await pageLocale(params)

  return <MemberHomePage />
}
