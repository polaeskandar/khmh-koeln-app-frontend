import type { Metadata } from "next"

import { PendingPage } from "@/features/identity/auth/pending-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-in/pending">): Promise<Metadata> {
  return { title: await pageTitle(params, "signInPending") }
}

export default async function Page({ params }: PageProps<"/[locale]/sign-in/pending">) {
  await pageLocale(params)

  return <PendingPage />
}
