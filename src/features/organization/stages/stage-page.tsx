"use client"

import { StageMembers } from "@/features/people/members/stage-members"

import { StageLayout } from "./stage-layout"

export function StagePage() {
  return (
    <StageLayout tab="overview">
      {(stage) => <StageMembers key={stage.id} stage={stage} />}
    </StageLayout>
  )
}
