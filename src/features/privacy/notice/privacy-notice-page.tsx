"use client"

import { ArrowLeft, FileWarning } from "lucide-react"
import { useTranslations } from "next-intl"

import { AuthFrame } from "@/features/identity/auth/auth-frame"
import { Link, useRouter } from "@/i18n/navigation"
import type { PrivacyBlock, PrivacyNotice } from "@/lib/privacy"
import { routes } from "@/lib/routes"

function BackLink() {
  const t = useTranslations("privacyNotice")
  const router = useRouter()

  return (
    <Link
      href={routes.signIn()}
      onClick={(event) => {
        if (window.history.length <= 1) {
          return
        }

        event.preventDefault()
        router.back()
      }}
      className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {t("back")}
    </Link>
  )
}

function Block({ block }: { block: PrivacyBlock }) {
  switch (block.kind) {
    case "heading":
      return <h2 className="font-heading text-lg font-semibold tracking-tight">{block.text}</h2>
    case "list":
      return (
        <ul className="flex list-disc flex-col gap-2 ps-5 leading-relaxed">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case "paragraph":
      return <p className="leading-relaxed">{block.text}</p>
  }
}

export function PrivacyNoticePage({ notice }: { notice: PrivacyNotice }) {
  const t = useTranslations("privacyNotice")

  return (
    <AuthFrame className="md:max-w-3xl">
      <BackLink />
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("version", { version: notice.version })}</p>
      </div>
      {notice.status === "draft" ? (
        <p role="note" className="flex items-start gap-2 border border-dashed p-4 text-sm">
          <FileWarning className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          {t("draft")}
        </p>
      ) : null}
      <div className="flex max-w-prose flex-col gap-4">
        {notice.blocks.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </div>
    </AuthFrame>
  )
}
