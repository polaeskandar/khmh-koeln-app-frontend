import type { Metadata } from "next"

import { SessionPage } from "@/features/meetings/meetings/session-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/meetings/sessions/view">): Promise<Metadata> {
  return { title: await pageTitle(params, "session") }
}

export default async function Page({ params }: PageProps<"/[locale]/meetings/sessions/view">) {
  await pageLocale(params)

  return <SessionPage />
}
