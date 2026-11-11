"use client"

import { useTranslations } from "next-intl"

import { Section } from "@/components/page-header"
import { useFormat } from "@/i18n/format"

import { type ErasureReview, mentionLabelOf } from "./api"
import { Lines, useEraseLines } from "./erase-lines"

const KEEP_KEYS = ["sessionTotals", "accountRows"] as const

export function ErasureReviewSections({ review }: { review: ErasureReview }) {
  const t = useTranslations("privacy.detail")
  const tm = useTranslations("privacy.mention")
  const tk = useTranslations("privacy.keep")
  const f = useFormat()
  const eraseLines = useEraseLines()

  const keep = KEEP_KEYS.flatMap((key) => {
    const count = review.keep[key] ?? 0

    return count > 0 ? [tk(key, { count })] : []
  })

  return (
    <>
      <Section id="erases" title={t("erases")} description={t("erasesDescription")}>
        <Lines lines={eraseLines(review.erase)} />
      </Section>
      <Section id="keeps" title={t("keeps")} description={t("keepsDescription")}>
        <Lines lines={keep} />
      </Section>
      <Section
        id="mentions"
        title={t("mentions", { count: review.mentions.length })}
        description={t("mentionsDescription")}
      >
        {review.mentions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noMentions")}</p>
        ) : (
          <ul className="flex flex-col divide-y border-y">
            {review.mentions.map((mention) => {
              const label = mentionLabelOf(mention.where)

              return (
                <li key={mention.id} className="flex flex-col gap-1 py-3 text-sm">
                  <span className="text-xs text-muted-foreground">
                    {t("mentionWhere", {
                      where: label ? tm(label) : mention.where,
                      group: mention.group ?? "",
                      date: mention.date ? f.mediumDate(mention.date) : "",
                    })}
                  </span>
                  <blockquote dir="auto" className="border-s-2 ps-3">
                    {mention.text}
                  </blockquote>
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </>
  )
}
