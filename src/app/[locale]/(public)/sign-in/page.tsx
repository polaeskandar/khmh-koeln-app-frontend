import type { Metadata } from "next"

import { SignInPage } from "@/features/identity/auth/sign-in-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  return { title: await pageTitle(params, "signIn") }
}

export default async function Page({ params }: PageProps<"/[locale]/sign-in">) {
  await pageLocale(params)

  return <SignInPage />
}
