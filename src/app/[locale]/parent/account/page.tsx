import type { Metadata } from "next"

import { ParentAccountPage } from "@/features/portals/parent/parent-account-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/parent/account">): Promise<Metadata> {
  return { title: await pageTitle(params, "parentAccount") }
}

export default async function Page({ params }: PageProps<"/[locale]/parent/account">) {
  await pageLocale(params)

  return <ParentAccountPage />
}
