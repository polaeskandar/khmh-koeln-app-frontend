export const LOCALES = ["en", "de", "ar"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "en"

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  ar: "العربية",
}

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value)

export const directionOf = (locale: Locale): "ltr" | "rtl" => (locale === "ar" ? "rtl" : "ltr")

export function negotiateLocale(acceptLanguage: string | null | undefined): Locale | null {
  if (!acceptLanguage) {
    return null
  }

  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";")
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="))

      return { language: tag.toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) : 1, index }
    })
    .filter((x) => x.language && !Number.isNaN(x.q) && x.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)

  return ranked.map((x) => x.language).find(isLocale) ?? null
}
