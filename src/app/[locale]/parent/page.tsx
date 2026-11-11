import type { Metadata } from "next"

import { ParentHomePage } from "@/features/portals/parent/parent-home-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/parent">): Promise<Metadata> {
  return { title: await pageTitle(params, "parentHome") }
}

export default async function Page({ params }: PageProps<"/[locale]/parent">) {
  await pageLocale(params)

  return <ParentHomePage />
}
