import type { Metadata } from "next"

import { RolePage } from "@/features/identity/roles/role-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/roles/view">): Promise<Metadata> {
  return { title: await pageTitle(params, "role") }
}

export default async function Page({ params }: PageProps<"/[locale]/settings/roles/view">) {
  await pageLocale(params)

  return <RolePage />
}
