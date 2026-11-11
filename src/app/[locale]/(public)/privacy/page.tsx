import type { Metadata } from "next"

import { readPrivacyNotice } from "@/features/privacy/notice/notice"
import { PrivacyNoticePage } from "@/features/privacy/notice/privacy-notice-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  return { title: await pageTitle(params, "privacy") }
}

export default async function Page({ params }: PageProps<"/[locale]/privacy">) {
  return <PrivacyNoticePage notice={readPrivacyNotice(await pageLocale(params))} />
}
