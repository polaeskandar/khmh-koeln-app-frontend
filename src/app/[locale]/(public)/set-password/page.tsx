import type { Metadata } from "next"

import { SetPasswordPage } from "@/features/identity/auth/set-password-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/set-password">): Promise<Metadata> {
  return { title: await pageTitle(params, "setPassword"), referrer: "no-referrer" }
}

export default async function Page({ params }: PageProps<"/[locale]/set-password">) {
  await pageLocale(params)

  return <SetPasswordPage />
}
