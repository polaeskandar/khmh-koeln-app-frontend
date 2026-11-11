import type { Metadata } from "next"

import { RegisteredPage } from "@/features/identity/auth/registered-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/register/done">): Promise<Metadata> {
  return { title: await pageTitle(params, "registered") }
}

export default async function Page({ params }: PageProps<"/[locale]/register/done">) {
  await pageLocale(params)

  return <RegisteredPage />
}
