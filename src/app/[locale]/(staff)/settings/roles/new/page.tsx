import type { Metadata } from "next"

import { NewRolePage } from "@/features/identity/roles/new-role-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings/roles/new">): Promise<Metadata> {
  return { title: await pageTitle(params, "newRole") }
}

export default async function Page({ params }: PageProps<"/[locale]/settings/roles/new">) {
  await pageLocale(params)

  return <NewRolePage />
}
