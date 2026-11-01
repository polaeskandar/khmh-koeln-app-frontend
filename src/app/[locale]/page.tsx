import { setRequestLocale } from "next-intl/server"

import type { Locale } from "@/i18n/config"

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="flex max-w-md flex-col gap-2 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">KHMK Köln</h1>
        <p className="text-sm text-muted-foreground">
          The application is initialized. Features are added through tickets.
        </p>
      </div>
    </main>
  )
}
