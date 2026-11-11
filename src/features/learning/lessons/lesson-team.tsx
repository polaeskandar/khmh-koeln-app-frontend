"use client"

import { useTranslations } from "next-intl"

import { MemberAvatar } from "@/components/member-avatar"
import { Button } from "@/components/ui/button"
import { initialsOf } from "@/features/identity/auth/role-summary"
import { Link } from "@/i18n/navigation"
import { routes } from "@/lib/routes"

import type { LessonDetail } from "./api"
import { LessonPanel } from "./visibility"

function ServantLine({ name, seed, role }: { name: string; seed?: string; role: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <MemberAvatar name={name} initials={initialsOf(name)} seed={seed} className="size-7" />
      <span className="flex min-w-0 flex-col leading-tight">
        <bdi className="font-medium">{name}</bdi>
        <span className="text-xs text-muted-foreground">{role}</span>
      </span>
    </li>
  )
}

export function LessonTeam({ lesson }: { lesson: LessonDetail["lesson"] }) {
  const t = useTranslations()

  return (
    <LessonPanel title={t("lessons.fields.servants")}>
      <ul className="flex flex-col gap-2 text-sm">
        <ServantLine
          name={lesson.responsible?.name ?? t("common.formerAccount")}
          seed={lesson.responsible?.id}
          role={t("lessons.fields.responsible")}
        />
        {lesson.collaborators.map((helper, index) => (
          <ServantLine
            key={helper?.id ?? index}
            name={helper?.name ?? t("common.formerAccount")}
            seed={helper?.id}
            role={t("lessons.detail.helping")}
          />
        ))}
      </ul>
      {lesson.meeting.kind === "session" ? (
        <Button variant="outline" size="sm" asChild className="self-start">
          <Link href={routes.session(lesson.meeting.id)}>{t("lessons.detail.openSession")}</Link>
        </Button>
      ) : null}
    </LessonPanel>
  )
}
