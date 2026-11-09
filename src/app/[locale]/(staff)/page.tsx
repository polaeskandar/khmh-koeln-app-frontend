import { Dashboard } from "@/features/meetings/dashboard/dashboard"
import { pageLocale } from "@/i18n/page"

export default async function Page({ params }: PageProps<"/[locale]">) {
  await pageLocale(params)

  return <Dashboard />
}
