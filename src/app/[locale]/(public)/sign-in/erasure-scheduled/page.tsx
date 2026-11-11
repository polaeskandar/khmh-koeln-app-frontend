import type { Metadata } from "next"

import { ErasureScheduledPage } from "@/features/identity/auth/erasure-scheduled-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-in/erasure-scheduled">): Promise<Metadata> {
  return { title: await pageTitle(params, "signInErasureScheduled") }
}

export default async function Page({ params }: PageProps<"/[locale]/sign-in/erasure-scheduled">) {
  await pageLocale(params)

  return <ErasureScheduledPage />
}
