import type { Metadata } from "next"

import { MembersPage } from "@/features/people/members/members-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/members">): Promise<Metadata> {
  return { title: await pageTitle(params, "members") }
}

export default async function Page({ params }: PageProps<"/[locale]/members">) {
  await pageLocale(params)

  return <MembersPage />
}
