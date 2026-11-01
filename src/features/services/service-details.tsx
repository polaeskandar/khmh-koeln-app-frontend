"use client"

import { useTranslations } from "next-intl"

import { RecordPage } from "@/components/record-page"

export function ServiceDetails() {
  const t = useTranslations()

  return (
    <RecordPage notFound={<h1 className="p-8 font-heading text-xl">{t("notFound.title")}</h1>}>
      {(id) => (
        <main className="flex flex-col gap-2 p-8">
          <h1 className="font-heading text-xl">{t("nav.services")}</h1>
          <p className="text-sm text-muted-foreground">{id}</p>
        </main>
      )}
    </RecordPage>
  )
}
