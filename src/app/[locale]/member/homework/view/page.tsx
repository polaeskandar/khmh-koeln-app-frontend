import type { Metadata } from "next"

import { MemberTaskPage } from "@/features/learning/homework/member-task-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/member/homework/view">): Promise<Metadata> {
  return { title: await pageTitle(params, "memberHomeworkTask") }
}

export default async function Page({ params }: PageProps<"/[locale]/member/homework/view">) {
  await pageLocale(params)

  return <MemberTaskPage />
}
