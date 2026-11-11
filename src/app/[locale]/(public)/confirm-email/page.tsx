import type { Metadata } from "next"

import { ConfirmEmailPage } from "@/features/identity/auth/confirm-email-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/confirm-email">): Promise<Metadata> {
  return { title: await pageTitle(params, "confirmEmail"), referrer: "no-referrer" }
}

export default async function Page({ params }: PageProps<"/[locale]/confirm-email">) {
  await pageLocale(params)

  return <ConfirmEmailPage />
}
