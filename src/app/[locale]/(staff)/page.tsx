import { StaffHome } from "@/features/attendance/attendance-overview"
import { pageLocale } from "@/i18n/page"

export default async function Page({ params }: PageProps<"/[locale]">) {
  await pageLocale(params)

  return <StaffHome />
}
