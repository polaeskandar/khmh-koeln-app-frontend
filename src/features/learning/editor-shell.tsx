"use client"

import type { ComponentProps, ReactNode, RefObject } from "react"

import { Topbar } from "@/components/app-shell/topbar"
import { PageBody, PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
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

export function EditorForm({
  formRef,
  aside,
  onSubmit,
  children,
}: {
  formRef: RefObject<HTMLFormElement | null>
  aside: ReactNode
  onSubmit: () => void
  children: ReactNode
}) {
  return (
    <form
      ref={formRef}
      noValidate
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
      <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
        {aside}
      </aside>
    </form>
  )
}

export function SaveButton({
  pending,
  active,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "disabled"> & { pending: boolean; active: boolean }) {
  return (
    <Button disabled={pending} {...props}>
      {pending && active ? <Spinner data-icon="inline-start" /> : null}
      {children}
    </Button>
  )
}
