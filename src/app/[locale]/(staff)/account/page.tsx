import type { Metadata } from "next"

import { AccountPage } from "@/features/identity/account/account-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account">): Promise<Metadata> {
  return { title: await pageTitle(params, "account") }
}

export default async function Page({ params }: PageProps<"/[locale]/account">) {
  await pageLocale(params)

  return <AccountPage />
}
