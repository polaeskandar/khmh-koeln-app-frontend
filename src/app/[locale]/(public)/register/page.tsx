import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { RegisterPage } from "@/features/auth/register-pages"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/register">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "auth.register" })

  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/register">) {
  await pageLocale(params)

  return <RegisterPage />
}
