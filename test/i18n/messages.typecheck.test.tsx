import { render, screen } from "@testing-library/react"
import { type Messages, NextIntlClientProvider, useTranslations } from "next-intl"
import { describe, expect, test } from "vitest"

import ar from "../../messages/ar.json"
import de from "../../messages/de.json"

function Close() {
  const t = useTranslations("common")

  return <button type="button">{t("close")}</button>
}

describe("the catalogs under their providers", () => {
  test.each([
    ["de", de, "Schließen"],
    ["ar", ar, "إغلاق"],
  ] as const)("%s shows its own text", (locale, messages, text) => {
    render(
      <NextIntlClientProvider locale={locale} messages={messages as unknown as Messages}>
        <Close />
      </NextIntlClientProvider>
    )

    expect(screen.getByRole("button", { name: text })).toBeInTheDocument()
  })
})

export function TypedMessages() {
  const t = useTranslations()
  // @ts-expect-error: not a key of messages/en.json
  t("nonexistent.key")
  // @ts-expect-error: the message needs {name} and {count}
  t("errors.services.hasHistory", { name: "Choir" })

  return t("errors.services.hasHistory", { name: "Choir", count: 12 })
}
