import type { Metadata } from "next"

import { TakeAttendancePage } from "@/features/meetings/attendance/take-attendance-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/attendance/take">): Promise<Metadata> {
  return { title: await pageTitle(params, "takeAttendance") }
}

export default async function Page({ params }: PageProps<"/[locale]/attendance/take">) {
  await pageLocale(params)

  return <TakeAttendancePage />
}
