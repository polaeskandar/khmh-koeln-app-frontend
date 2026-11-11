import type { Metadata } from "next"

import { MemberHomeworkPage } from "@/features/learning/homework/member-homework-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/member/homework">): Promise<Metadata> {
  return { title: await pageTitle(params, "memberHomework") }
}

export default async function Page({ params }: PageProps<"/[locale]/member/homework">) {
  await pageLocale(params)

  return <MemberHomeworkPage />
}
