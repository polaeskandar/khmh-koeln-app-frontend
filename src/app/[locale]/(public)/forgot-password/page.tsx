import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ForgotPasswordPage } from "@/features/identity/auth/password-pages"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  const t = await getTranslations({
    locale: await pageLocale(params),
    namespace: "auth.forgotOffice",
  })

  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/forgot-password">) {
  await pageLocale(params)

  return <ForgotPasswordPage />
}
