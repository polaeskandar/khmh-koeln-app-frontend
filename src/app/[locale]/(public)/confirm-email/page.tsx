import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ConfirmEmailPage } from "@/features/identity/auth/confirm-email-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/confirm-email">): Promise<Metadata> {
  const t = await getTranslations({
    locale: await pageLocale(params),
    namespace: "auth.confirmEmail",
  })

  return { title: t("title"), referrer: "no-referrer" }
}

export default async function Page({ params }: PageProps<"/[locale]/confirm-email">) {
  await pageLocale(params)

  return <ConfirmEmailPage />
}
