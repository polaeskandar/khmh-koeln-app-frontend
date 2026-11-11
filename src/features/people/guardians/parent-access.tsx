"use client"

import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { FormDialog } from "@/components/form-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { SelectField } from "@/components/form-fields"
import { Section } from "@/components/page-header"
import { QueryState } from "@/components/page-states"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup } from "@/components/ui/field"
import { NativeSelectOption } from "@/components/ui/native-select"
import { useCan } from "@/features/identity/auth/session"
import { useFormat } from "@/i18n/format"
import { isStale, useRefetch } from "@/lib/api/refetch"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { isolate } from "@/lib/bidi"
import { preferredName } from "@/lib/domain/names"

import { type DirectoryPerson } from "@/features/people/members/api"
import {
  giveAccessRequest,
  type GuardianLink,
  type GuardianLinks,
  guardianLinksQuery,
  revokeAccessRequest,
  GUARDIAN_LINK_QUERIES,
} from "./api"
import { PersonSearch } from "@/features/people/members/person-search"

function GiveAccessDialog({
  accounts,
  onClose,
}: {
  accounts: GuardianLinks["accounts"]
  onClose: () => void
}) {
  const t = useTranslations("settings.parents")
  const [userId, setUserId] = useState("")
  const [child, setChild] = useState<DirectoryPerson | null>(null)
  const toastText = useTranslations("toast")

  const give = useApiMutation(giveAccessRequest, {
    successMessage: toastText("accessGiven"),
    invalidate: GUARDIAN_LINK_QUERIES,
    toastOnError: false,
    onSuccess: onClose,
  })

  const childError = give.fieldErrors.personId

  const problem =
    give.problem && Object.keys(give.fieldErrors).length === 0 ? give.problem.message : null

  return (
    <FormDialog
      title={t("giveTitle")}
      description={t("giveDescription")}
      pending={give.pending}
      problem={give.problem}
      submitLabel={t("giveAccess")}
      submitDisabled={!userId || !child}
      onSubmit={() => child && give.execute({ userId, personId: child.id })}
      onClose={onClose}
    >
      {problem ? (
        <Alert variant="destructive">
          <AlertDescription>{problem}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <SelectField
          label={t("parentAccount")}
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
        </SelectField>
        <Field data-invalid={childError ? true : undefined}>
          <PersonSearch
            label={t("child")}
            chosen={child ? [child] : []}
            onChange={(people) => setChild(people.at(-1) ?? null)}
          />
          {childError ? <FieldError>{childError}</FieldError> : null}
        </Field>
      </FieldGroup>
    </FormDialog>
  )
}

function LinkRow({ link, today, manage }: { link: GuardianLink; today: string; manage: boolean }) {
  const t = useTranslations()
  const f = useFormat()
  const refetch = useRefetch()
  const [removing, setRemoving] = useState(false)

  const revoke = useApiMutation(revokeAccessRequest, {
    successMessage: t("toast.accessRemoved"),
    invalidate: GUARDIAN_LINK_QUERIES,
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
        {manage ? (
          <Button variant="ghost" size="sm" onClick={() => setRemoving(true)}>
            {t("settings.parents.remove")}
          </Button>
        ) : null}
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

            if (!result.ok && isStale(result.problem, [404])) {
              void refetch(GUARDIAN_LINK_QUERIES)

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
  const manage = useCan()("update", "users")
  const query = useQuery(guardianLinksQuery)
  const [giving, setGiving] = useState(false)

  return (
    <Section
      id="parents"
      title={t("title")}
      description={t("description")}
      actions={
        query.data && manage ? (
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
                      <LinkRow key={link.id} link={link} today={data.today} manage={manage} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {giving ? (
              <GiveAccessDialog accounts={data.accounts} onClose={() => setGiving(false)} />
            ) : null}
          </div>
        )}
      </QueryState>
    </Section>
  )
}
