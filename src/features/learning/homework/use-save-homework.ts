"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { useSubmitOnce } from "@/hooks/use-submit-once"
import { useRouter } from "@/i18n/navigation"
import type { Uuid } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { routes } from "@/lib/routes"

import {
  createHomeworkRequest,
  type HomeworkDetail,
  type HomeworkRequest,
  type HomeworkStatus,
  HOMEWORK_SAVE_QUERIES,
  updateHomeworkRequest,
} from "./api"
import { usePublishHomework } from "./use-publish-homework"

export type SaveStep = "save" | "publish"

type HomeworkFields = HomeworkRequest & { title: string }

export function useSaveHomework({
  stageId,
  lessonId,
  homework,
  fromLesson,
}: {
  stageId: Uuid
  lessonId: Uuid
  homework?: HomeworkDetail
  fromLesson: Uuid | null
}) {
  const t = useTranslations("homework.toast")
  const router = useRouter()
  const [savedId, setSavedId] = useState<Uuid | null>(homework?.id ?? null)
  const [version, setVersion] = useState(homework?.version ?? 0)
  const [step, setStep] = useState<SaveStep>("save")
  const publisher = usePublishHomework(t("publishedNew"))
  const lessonPage = fromLesson ? routes.lesson(fromLesson) : null

  const mutation = useApiMutation(
    (input: HomeworkRequest) =>
      savedId
        ? updateHomeworkRequest(savedId, version, input)
        : createHomeworkRequest(lessonId, input),
    { invalidate: HOMEWORK_SAVE_QUERIES }
  )

  const afterSave = (status: HomeworkStatus) => lessonPage ?? routes.stageHomework(stageId, status)

  const savedToastOf = (status: HomeworkStatus) => {
    if (status === "published") {
      return t("savedPublished")
    }

    return homework ? t("savedDraft") : t("draftSaved")
  }

  const submit = useSubmitOnce(async (next: SaveStep, fieldsOf: () => HomeworkFields) => {
    setStep(next)
    const fields = fieldsOf()
    const saved = await mutation.execute(fields)

    if (!saved.ok) {
      return
    }

    setSavedId(saved.data.id)
    setVersion(saved.data.version)

    if (next === "save") {
      toast.success(savedToastOf(saved.data.status))

      router.push(afterSave(saved.data.status))

      return
    }

    const result = await publisher.publish({
      id: saved.data.id,
      title: fields.title,
      publishedAt: homework?.publishedAt ?? null,
    })

    if (result?.ok) {
      router.push(afterSave("published"))
    } else if (!homework) {
      router.replace(routes.editHomework(saved.data.id, fromLesson))
    }
  })

  return {
    submit,
    step,
    savedId,
    lessonPage,
    pending: mutation.pending || publisher.pending,
    problem: mutation.problem,
    fieldErrors: mutation.fieldErrors,
  }
}
