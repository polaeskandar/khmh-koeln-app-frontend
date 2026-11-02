import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SetPasswordPage } from "@/features/auth/password-pages"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/set-password">): Promise<Metadata> {
  const t = await getTranslations({
    locale: await pageLocale(params),
    namespace: "auth.setPassword",
  })

  return { title: t("title"), referrer: "no-referrer" }
}

export default async function Page({ params }: PageProps<"/[locale]/set-password">) {
  await pageLocale(params)

  return <SetPasswordPage />
}
