"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { useFormat } from "@/i18n/format"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { preferredName } from "@/lib/domain/names"

import {
  type DirectoryPerson,
  giveAccessRequest,
  type GuardianLink,
  type GuardianLinks,
  guardianLinksQuery,
  revokeAccessRequest,
} from "./api"
import { PersonSearch } from "./person-search"

const LINK_QUERIES = [["guardian-links"]]

function GiveAccessDialog({
  accounts,
  open,
  onOpenChange,
}: {
  accounts: GuardianLinks["accounts"]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("settings.parents")
  const [userId, setUserId] = useState("")
  const [child, setChild] = useState<DirectoryPerson | null>(null)
  const toastText = useTranslations("toast")

  const give = useApiMutation(giveAccessRequest, {
    successMessage: toastText("accessGiven"),
    invalidate: LINK_QUERIES,
    toastOnError: false,
    onSuccess: () => onOpenChange(false),
  })

  const childError = give.fieldErrors.personId

  const problem =
    give.problem && Object.keys(give.fieldErrors).length === 0 ? give.problem.message : null

  return (
    <Dialog open={open} onOpenChange={(next) => (next || !give.pending) && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("giveTitle")}</DialogTitle>
          <DialogDescription>{t("giveDescription")}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()

            if (userId && child) {
              void give.execute({ userId, personId: child.id })
            }
          }}
        >
          {problem ? (
            <Alert variant="destructive">
              <AlertDescription>{problem}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="parent-account">{t("parentAccount")}</FieldLabel>
              <NativeSelect
                id="parent-account"
                className="w-full"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
              >
                <NativeSelectOption value="" disabled>
                  {t("parentAccount")}
                </NativeSelectOption>
                {accounts.map((account) => (
                  <NativeSelectOption key={account.id} value={account.id}>
                    {`${account.name} · ${account.email}`}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field data-invalid={childError ? true : undefined}>
              <PersonSearch
                label={t("child")}
                chosen={child ? [child] : []}
                onChange={(people) => setChild(people.at(-1) ?? null)}
              />
              {childError ? <FieldError>{childError}</FieldError> : null}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={!userId || !child || give.pending}>
              {give.pending ? <Spinner data-icon="inline-start" /> : null}
              {t("giveAccess")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LinkRow({ link, today }: { link: GuardianLink; today: string }) {
  const t = useTranslations()
  const f = useFormat()
  const queryClient = useQueryClient()
  const [removing, setRemoving] = useState(false)

  const revoke = useApiMutation(revokeAccessRequest, {
    successMessage: t("toast.accessRemoved"),
    invalidate: LINK_QUERIES,
  })

  const child = preferredName(link.child)

  return (
    <tr className="border-b last:border-b-0">
      <td className="px-3 py-3">
        <span className="flex min-w-0 flex-col">
          <bdi className="font-medium">{link.parent.name}</bdi>
          <span dir="ltr" className="text-start text-xs text-muted-foreground">
            {link.parent.email}
          </span>
        </span>
      </td>
      <td className="px-3 py-3">
        <bdi>{child}</bdi>
        <span className="text-muted-foreground">
          {" · "}
          {link.child.groups.length > 0
            ? link.child.groups.map((g) => g.stage?.name ?? g.service.name).join(f.separator)
            : t("accountRequests.approve.noGroup")}
        </span>
      </td>
      <td className="px-3 py-3 text-sm text-muted-foreground">
        {t("settings.parents.approvedAtBy", {
          when: f.atLabel(link.approvedAt, today),
          name: link.approvedBy?.name ?? t("common.formerAccount"),
        })}
      </td>
      <td className="px-3 py-3 text-end">
        <Button variant="ghost" size="sm" onClick={() => setRemoving(true)}>
          {t("settings.parents.remove")}
        </Button>
        <ConfirmDialog
          open={removing}
          onOpenChange={setRemoving}
          title={t("settings.parents.removeTitle", {
            parent: isolate(link.parent.name),
            child: isolate(child),
          })}
          description={t("settings.parents.removeDescription")}
          confirmLabel={t("settings.parents.removeAccess")}
          tone="destructive"
          onConfirm={async () => {
            const result = await revoke.execute(link.id)

            if (!result.ok && result.problem.status === 404) {
              void queryClient.invalidateQueries({ queryKey: ["guardian-links"] })

              return true
            }

            return result.ok
          }}
        />
      </td>
    </tr>
  )
}

export function ParentAccess() {
  const t = useTranslations("settings.parents")
  const query = useQuery(guardianLinksQuery)
  const [giving, setGiving] = useState(false)

  return (
    <Section
      id="parents"
      title={t("title")}
      description={t("description")}
      actions={
        query.data ? (
          <Button variant="outline" onClick={() => setGiving(true)}>
            <Plus data-icon="inline-start" />
            {t("give")}
          </Button>
        ) : null
      }
    >
      <QueryState query={query}>
        {(data) => (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {t("summary", { count: data.items.length })}
            </p>
            {data.items.length > 0 ? (
              <div className="overflow-x-auto border">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-muted/40">
                    <tr className="border-b text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      <th scope="col" className="px-3 py-2 text-start">
                        {t("parent")}
                      </th>
                      <th scope="col" className="px-3 py-2 text-start">
                        {t("child")}
                      </th>
                      <th scope="col" className="px-3 py-2 text-start">
                        {t("approved")}
                      </th>
                      <th scope="col" className="px-3 py-2">
                        <span className="sr-only">{t("actions")}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((link) => (
                      <LinkRow key={link.id} link={link} today={data.today} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {giving ? (
              <GiveAccessDialog accounts={data.accounts} open={giving} onOpenChange={setGiving} />
            ) : null}
          </div>
        )}
      </QueryState>
    </Section>
  )
}
