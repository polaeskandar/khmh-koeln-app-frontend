import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SignInPage } from "@/features/identity/auth/sign-in-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "auth.signIn" })

  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/sign-in">) {
  await pageLocale(params)

  return <SignInPage />
}
