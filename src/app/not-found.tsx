import { KhmkMark } from "@/components/brand/logo"
import { LOCALE_NAMES, LOCALES } from "@/i18n/config"

import ar from "../../messages/ar.json"
import de from "../../messages/de.json"
import en from "../../messages/en.json"

const catalogs = { en, de, ar }

export default function RootNotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-6 px-4 py-10">
      <KhmkMark className="size-10" />
      {LOCALES.map((locale) => (
        <section
          key={locale}
          lang={locale}
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="flex flex-col gap-2"
        >
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            {catalogs[locale].notFound.title}
          </h1>
          <a href={`/${locale}/`} className="text-sm font-medium underline underline-offset-4">
            {catalogs[locale].notFound.root.openApp} · {LOCALE_NAMES[locale]}
          </a>
        </section>
      ))}
    </main>
  )
}
