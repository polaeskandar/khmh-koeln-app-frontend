"use client"

import { useTranslations } from "next-intl"

import { type LessonDetail, linesOf } from "./api"
import { LessonPanel } from "./visibility"

type Lesson = LessonDetail["lesson"]

function TextList({
  lines,
  empty,
  ordered = false,
}: {
  lines: string[]
  empty: string
  ordered?: boolean
}) {
  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }

  const List = ordered ? "ol" : "ul"

  return (
    <List
      dir="auto"
      className={
        ordered ? "flex list-decimal flex-col gap-1 ps-5" : "flex list-disc flex-col gap-1 ps-5"
      }
    >
      {lines.map((line, index) => (
        <li key={index}>{line}</li>
      ))}
    </List>
  )
}

function Materials({ materials }: { materials: Lesson["materials"] }) {
  const t = useTranslations()

  if (materials.length === 0) {
    return <p className="text-muted-foreground">{t("lessons.detail.noMaterials")}</p>
  }

  return (
    <ul className="flex list-disc flex-col gap-1 ps-5">
      {materials.map((material, index) => (
        <li key={index} dir="auto">
          {material.url ? (
            <a
              href={material.url}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              {material.label || material.url}
            </a>
          ) : (
            material.label
          )}
        </li>
      ))}
    </ul>
  )
}

export function TeachingPlan({ lesson }: { lesson: Lesson }) {
  const t = useTranslations()

  return (
    <LessonPanel title={t("lessons.fields.teachingPlan")} who="servants">
      <div className="flex flex-col gap-4 text-sm">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium">{t("lessons.fields.objectives")}</h3>
          {lesson.objectives ? (
            <p dir="auto" className="whitespace-pre-line">
              {lesson.objectives}
            </p>
          ) : (
            <p className="text-muted-foreground">{t("lessons.detail.noObjectives")}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-medium">{t("lessons.fields.teachingPoints")}</h3>
          <TextList
            ordered
            lines={linesOf(lesson.teachingPoints)}
            empty={t("lessons.detail.noTeachingPoints")}
          />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-medium">{t("lessons.fields.activities")}</h3>
          <TextList lines={linesOf(lesson.activities)} empty={t("lessons.detail.noActivities")} />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-medium">{t("lessons.fields.materials")}</h3>
          <Materials materials={lesson.materials} />
        </div>
        {lesson.notes ? (
          <div className="flex flex-col gap-1">
            <h3 className="font-medium">{t("lessons.fields.notes")}</h3>
            <p dir="auto" className="whitespace-pre-line">
              {lesson.notes}
            </p>
          </div>
        ) : null}
      </div>
    </LessonPanel>
  )
}

export function SharedWithParents({ data }: { data: LessonDetail }) {
  const t = useTranslations()
  const { lesson, homework } = data

  return (
    <LessonPanel title={t("lessons.detail.sharedWithParents")} who="parents">
      <div className="flex flex-col gap-2 text-sm">
        <p dir="auto">{lesson.passage ?? t("lessons.detail.noPassage")}</p>
        <p dir="auto" className="whitespace-pre-line text-muted-foreground">
          {lesson.memoryVerse ?? t("lessons.detail.noMemoryVerse")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("lessons.detail.sharedHint", { count: homework.published })}
        </p>
      </div>
    </LessonPanel>
  )
}
