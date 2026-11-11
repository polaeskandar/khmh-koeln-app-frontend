"use client"

import { useTranslations } from "next-intl"
import type { ChangeEvent, ReactNode } from "react"

import { cn } from "@/lib/utils"
import { FormPanel } from "@/components/form-panel"
import { TextAreaField, TextField } from "@/components/form-fields"
import { FieldGroup } from "@/components/ui/field"
import { LinkRowsEditor, type useLinkRows } from "@/features/learning/link-rows"

import type { Lesson } from "./api"
import { type Audience, VisibilityNote } from "./visibility"

export type LessonTexts = {
  title: string
  summary: string
  passage: string
  memoryVerse: string
  objectives: string
  teachingPoints: string
  activities: string
  notes: string
}

export function lessonTextsOf(lesson?: Lesson): LessonTexts {
  return {
    title: lesson?.title ?? "",
    summary: lesson?.summary ?? "",
    passage: lesson?.passage ?? "",
    memoryVerse: lesson?.memoryVerse ?? "",
    objectives: lesson?.objectives ?? "",
    teachingPoints: lesson?.teachingPoints ?? "",
    activities: lesson?.activities ?? "",
    notes: lesson?.notes ?? "",
  }
}

type TextFieldsProps = {
  texts: LessonTexts
  errors: Record<string, string>
  onChange: (key: keyof LessonTexts) => (event: ChangeEvent<{ value: string }>) => void
}

function Block({ title, who, children }: { title: string; who?: Audience; children: ReactNode }) {
  return (
    <FormPanel
      title={title}
      note={who ? <VisibilityNote who={who} /> : null}
      className={cn(
        who === "servants" && "bg-muted/30",
        who === "parents" && "border-s-4 border-s-success"
      )}
    >
      {children}
    </FormPanel>
  )
}

function LessonDetailsBlocks({
  texts,
  errors,
  onChange,
  isNew,
}: TextFieldsProps & { isNew: boolean }) {
  const t = useTranslations("lessons")

  return (
    <>
      <Block title={t("lesson")}>
        <FieldGroup>
          <TextField
            label={t("editor.title")}
            dir="auto"
            value={texts.title}
            onChange={onChange("title")}
            maxLength={160}
            placeholder={t("editor.titlePlaceholder")}
            autoFocus={isNew}
            error={errors["details.title"]}
          />
          <TextAreaField
            label={t("editor.summary")}
            optional
            dir="auto"
            value={texts.summary}
            onChange={onChange("summary")}
            maxLength={1000}
            placeholder={t("editor.summaryPlaceholder")}
            error={errors["details.summary"]}
          />
        </FieldGroup>
      </Block>
      <Block title={t("editor.scripture")} who="parents">
        <FieldGroup>
          <TextField
            label={t("fields.passage")}
            optional
            dir="auto"
            value={texts.passage}
            onChange={onChange("passage")}
            maxLength={200}
            placeholder={t("editor.passagePlaceholder")}
            error={errors["details.passage"]}
          />
          <TextAreaField
            label={t("fields.memoryVerse")}
            optional
            dir="auto"
            value={texts.memoryVerse}
            onChange={onChange("memoryVerse")}
            maxLength={500}
            placeholder={t("editor.memoryVersePlaceholder")}
            error={errors["details.memoryVerse"]}
          />
        </FieldGroup>
      </Block>
    </>
  )
}

function TeachingPlanBlock({ texts, errors, onChange }: TextFieldsProps) {
  const t = useTranslations("lessons")

  return (
    <Block title={t("fields.teachingPlan")} who="servants">
      <FieldGroup>
        <TextAreaField
          label={t("fields.objectives")}
          optional
          dir="auto"
          value={texts.objectives}
          onChange={onChange("objectives")}
          maxLength={4000}
          placeholder={t("editor.objectivesPlaceholder")}
          error={errors["plan.objectives"]}
        />
        <TextAreaField
          label={t("fields.teachingPoints")}
          optional
          dir="auto"
          value={texts.teachingPoints}
          onChange={onChange("teachingPoints")}
          maxLength={4000}
          description={t("editor.teachingPointsHint")}
          error={errors["plan.teachingPoints"]}
        />
        <TextAreaField
          label={t("fields.activities")}
          optional
          dir="auto"
          value={texts.activities}
          onChange={onChange("activities")}
          maxLength={4000}
          description={t("editor.activitiesHint")}
          error={errors["plan.activities"]}
        />
      </FieldGroup>
    </Block>
  )
}

export function LessonFields({
  texts,
  errors,
  onChange,
  materials,
  isNew,
  viewNotes,
}: TextFieldsProps & {
  materials: ReturnType<typeof useLinkRows>
  isNew: boolean
  viewNotes: boolean
}) {
  const t = useTranslations("lessons")
  const fields = { texts, errors, onChange }

  return (
    <>
      <LessonDetailsBlocks {...fields} isNew={isNew} />
      <TeachingPlanBlock {...fields} />
      <Block title={t("fields.materials")} who="servants">
        <div className="flex flex-col gap-3">
          <LinkRowsEditor
            links={materials}
            errors={errors}
            prefix="plan.materials"
            texts={{
              label: (n) => t("editor.material", { n }),
              link: (n) => t("editor.materialLink", { n }),
              remove: (n) => t("editor.removeMaterial", { n }),
              labelPlaceholder: t("editor.materialPlaceholder"),
              linkPlaceholder: t("editor.materialLinkPlaceholder"),
              add: t("editor.addMaterial"),
            }}
          />
        </div>
      </Block>
      {viewNotes ? (
        <Block title={t("fields.notes")} who="servants">
          <TextAreaField
            label={t("editor.notesLabel")}
            optional
            dir="auto"
            value={texts.notes}
            onChange={onChange("notes")}
            maxLength={4000}
            placeholder={t("editor.notesPlaceholder")}
            error={errors["plan.notes"]}
          />
        </Block>
      ) : null}
    </>
  )
}
