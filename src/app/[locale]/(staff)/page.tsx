import { DashboardPage } from "@/features/meetings/dashboard/dashboard-page"
import { pageLocale } from "@/i18n/page"

export default async function Page({ params }: PageProps<"/[locale]">) {
  await pageLocale(params)

  return <DashboardPage />
}
