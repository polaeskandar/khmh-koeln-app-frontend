import type { Metadata } from "next"

import { ForgotPasswordPage } from "@/features/identity/auth/forgot-password-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  return { title: await pageTitle(params, "forgotPassword") }
}

export default async function Page({ params }: PageProps<"/[locale]/forgot-password">) {
  await pageLocale(params)

  return <ForgotPasswordPage />
}
