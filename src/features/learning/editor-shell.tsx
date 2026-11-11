"use client"

import type { ReactNode } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import { PageBody, PageHeader } from "@/components/page-header"
import { type StageCrumbsOf, useStageCrumbs } from "@/features/organization/stages/stage-layout"

export function StageEditorPage({
  stage,
  tab,
  title,
  description,
  children,
}: {
  stage: StageCrumbsOf
  tab: "lessons" | "homework"
  title: string
  description?: string
  children: ReactNode
}) {
  const crumbs = useStageCrumbs(stage, tab, [{ label: title }])

  return (
    <>
      <Topbar crumbs={crumbs} />
      <PageBody>
        <PageHeader title={title} description={description} />
        {children}
      </PageBody>
    </>
  )
}
