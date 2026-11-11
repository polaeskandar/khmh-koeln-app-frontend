import type { Metadata } from "next"

import { UnconfirmedPage } from "@/features/identity/auth/unconfirmed-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-in/unconfirmed">): Promise<Metadata> {
  return { title: await pageTitle(params, "signInUnconfirmed") }
}

export default async function Page({ params }: PageProps<"/[locale]/sign-in/unconfirmed">) {
  await pageLocale(params)

  return <UnconfirmedPage />
}
