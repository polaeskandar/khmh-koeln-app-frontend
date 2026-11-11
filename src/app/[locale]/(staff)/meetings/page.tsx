import type { Metadata } from "next"

import { AgendaPage } from "@/features/meetings/meetings/agenda-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/meetings">): Promise<Metadata> {
  return { title: await pageTitle(params, "meetings") }
}

export default async function Page({ params }: PageProps<"/[locale]/meetings">) {
  await pageLocale(params)

  return <AgendaPage />
}
