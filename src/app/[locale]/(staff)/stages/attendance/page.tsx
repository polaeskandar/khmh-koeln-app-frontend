import type { Metadata } from "next"

import { StageAttendancePage } from "@/features/meetings/attendance/stage-attendance-page"
import { pageLocale, pageTitle } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/stages/attendance">): Promise<Metadata> {
  return { title: await pageTitle(params, "stageAttendance") }
}

export default async function Page({ params }: PageProps<"/[locale]/stages/attendance">) {
  await pageLocale(params)

  return <StageAttendancePage />
}
