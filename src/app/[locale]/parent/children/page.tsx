import type { Metadata } from "next"

import { ParentChildrenPage } from "@/features/people/children/parent-children-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/parent/children">): Promise<Metadata> {
  return { title: await pageTitle(params, "parentChildren") }
}

export default async function Page({ params }: PageProps<"/[locale]/parent/children">) {
  await pageLocale(params)

  return <ParentChildrenPage />
}
