import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { readPrivacyNotice } from "@/features/privacy/notice/notice"
import { PrivacyNoticePage } from "@/features/privacy/notice/privacy-notice-page"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "privacyNotice" })

  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/privacy">) {
  return <PrivacyNoticePage notice={readPrivacyNotice(await pageLocale(params))} />
}
