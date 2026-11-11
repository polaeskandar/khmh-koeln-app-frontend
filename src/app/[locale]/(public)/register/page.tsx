import type { Metadata } from "next"

import { RegisterPage } from "@/features/identity/auth/register-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/register">): Promise<Metadata> {
  return { title: await pageTitle(params, "register") }
}

export default async function Page({ params }: PageProps<"/[locale]/register">) {
  await pageLocale(params)

  return <RegisterPage />
}
