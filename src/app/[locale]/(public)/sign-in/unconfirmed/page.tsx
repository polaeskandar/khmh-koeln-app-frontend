import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { UnconfirmedPage } from "@/features/identity/auth/sign-in-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-in/unconfirmed">): Promise<Metadata> {
  const t = await getTranslations({
    locale: await pageLocale(params),
    namespace: "auth.unconfirmed",
  })

  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/sign-in/unconfirmed">) {
  await pageLocale(params)

  return <UnconfirmedPage />
}
