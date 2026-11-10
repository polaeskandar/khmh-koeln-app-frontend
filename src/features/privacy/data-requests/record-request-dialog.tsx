"use client"

import { useIsMutating, useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"

import { TextAreaField, TextField } from "@/components/form-fields"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { peopleQuery } from "@/features/people/members/api"
import { useDebounced } from "@/hooks/use-debounced"
import { useRouter } from "@/i18n/navigation"
import type { LocalDate } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { fold, preferredName } from "@/lib/domain/names"
import { routes } from "@/lib/routes"

import {
  accountChoicesQuery,
  type NewDataRequest,
  recordDataRequest,
  type RequestKind,
  DATA_REQUEST_QUERIES,
} from "./api"

const CHANNELS = ["email", "letter", "in_person"] as const

function Choice({
  id,
  value,
  label,
  hint,
}: {
  id: string
  value: string
  label: string
  hint?: string
}) {
  return (
    <label
      htmlFor={`${id}-${value}`}
      className="flex cursor-pointer items-start gap-3 border p-3 text-sm"
    >
      <RadioGroupItem id={`${id}-${value}`} value={value} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{label}</span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </label>
  )
}

function SubjectSearch({
  about,
  subject,
  onChange,
  error,
}: {
  about: "member" | "account"
  subject: string | null
  onChange: (id: string | null) => void
  error?: string
}) {
  const t = useTranslations("privacy.record")
  const id = useId()
  const [text, setText] = useState("")
  const q = useDebounced(text.trim(), 250)

  const people = useQuery({
    ...peopleQuery({ status: "all", q }),
    enabled: about === "member" && q.length >= 2,
  })

  const accounts = useQuery({ ...accountChoicesQuery, enabled: about === "account" })

  const matches =
    about === "member"
      ? (people.data?.items ?? []).map((person) => ({
          id: person.person.id,
          label: preferredName(person.person),
        }))
      : (accounts.data?.accounts ?? [])
          .filter(
            (account) => q.length >= 2 && fold(`${account.name} ${account.email}`).includes(fold(q))
          )
          .map((account) => ({ id: account.id, label: `${account.name} · ${account.email}` }))

  return (
    <Field data-invalid={error ? true : undefined}>
      <Input
        aria-label={about === "member" ? t("findMember") : t("findAccount")}
        placeholder={about === "member" ? t("findMember") : t("findAccount")}
        value={text}
        aria-invalid={error ? true : undefined}
        onChange={(event) => {
          setText(event.target.value)
          onChange(null)
        }}
      />
      {q.length < 2 ? (
        <FieldDescription>{t("searchHint")}</FieldDescription>
      ) : matches.length === 0 ? (
        <FieldDescription>{t("noMatches")}</FieldDescription>
      ) : (
        <RadioGroup
          value={subject ?? ""}
          onValueChange={onChange}
          className="flex flex-col gap-0 divide-y border-y"
        >
          {matches.map((match) => (
            <label
              key={match.id}
              htmlFor={`${id}-${match.id}`}
              className="flex cursor-pointer items-center gap-3 py-2 text-sm"
            >
              <RadioGroupItem id={`${id}-${match.id}`} value={match.id} />
              <bdi>{match.label}</bdi>
            </label>
          ))}
        </RadioGroup>
      )}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}

function RecordForm({ today, onDone }: { today: LocalDate; onDone: () => void }) {
  const t = useTranslations()
  const router = useRouter()
  const id = useId()
  const [kind, setKind] = useState<RequestKind>("erasure")
  const [about, setAbout] = useState<"member" | "account">("member")
  const [subject, setSubject] = useState<string | null>(null)
  const [requestedBy, setRequestedBy] = useState("")
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("email")
  const [receivedOn, setReceivedOn] = useState(today)
  const [note, setNote] = useState("")

  const record = useApiMutation(recordDataRequest, {
    successMessage: t("toast.dataRequestRecorded"),
    invalidate: DATA_REQUEST_QUERIES,
    onSuccess: (saved) => {
      onDone()
      router.push(routes.dataRequest(saved.id))
    },
  })

  const errors = record.fieldErrors

  function submit() {
    const input: NewDataRequest = {
      kind,
      subject: about === "member" ? { personId: subject } : { accountId: subject },
      receipt: { requestedBy, channel, receivedOn },
      ...(note.trim() ? { note } : {}),
    }

    void record.execute(input)
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <FieldGroup>
        <FieldSet>
          <FieldLegend variant="label">{t("privacy.record.kind")}</FieldLegend>
          <RadioGroup
            value={kind}
            onValueChange={(value) => setKind(value as RequestKind)}
            className="flex flex-col gap-2"
          >
            <Choice
              id={`${id}-kind`}
              value="erasure"
              label={t("privacy.record.kinds.erasure")}
              hint={t("privacy.record.kinds.erasureHint")}
            />
            <Choice
              id={`${id}-kind`}
              value="copy"
              label={t("privacy.record.kinds.copy")}
              hint={t("privacy.record.kinds.copyHint")}
            />
          </RadioGroup>
        </FieldSet>
        <FieldSet>
          <FieldLegend variant="label">{t("privacy.record.about")}</FieldLegend>
          <FieldDescription>{t("privacy.record.aboutHint")}</FieldDescription>
          <RadioGroup
            value={about}
            onValueChange={(value) => {
              setAbout(value as "member" | "account")
              setSubject(null)
            }}
            className="grid grid-cols-2 gap-2"
          >
            <Choice id={`${id}-about`} value="member" label={t("privacy.record.abouts.member")} />
            <Choice id={`${id}-about`} value="account" label={t("privacy.record.abouts.account")} />
          </RadioGroup>
          <SubjectSearch
            key={about}
            about={about}
            subject={subject}
            onChange={setSubject}
            error={errors.subject}
          />
        </FieldSet>
        <TextField
          label={t("privacy.record.requestedBy")}
          dir="auto"
          value={requestedBy}
          maxLength={200}
          placeholder={t("privacy.record.requestedByPlaceholder")}
          onChange={(event) => setRequestedBy(event.target.value)}
          error={errors["receipt.requestedBy"]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${id}-channel`}>{t("privacy.record.channel")}</FieldLabel>
            <NativeSelect
              id={`${id}-channel`}
              className="w-full"
              value={channel}
              onChange={(event) => setChannel(event.target.value as (typeof CHANNELS)[number])}
            >
              {CHANNELS.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {t(`privacy.channel.${value}`)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <TextField
            label={t("privacy.record.receivedOn")}
            type="date"
            max={today}
            value={receivedOn}
            onChange={(event) => setReceivedOn(event.target.value)}
            error={errors["receipt.receivedOn"]}
          />
        </div>
        <TextAreaField
          label={t("privacy.record.note")}
          optional
          dir="auto"
          value={note}
          maxLength={2000}
          description={t("privacy.record.noteHint")}
          onChange={(event) => setNote(event.target.value)}
          error={errors.note}
        />
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" disabled={record.pending} onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={record.pending}>
          {record.pending ? <Spinner data-icon="inline-start" /> : null}
          {t("privacy.record.submit")}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function RecordRequestButton({ today }: { today: LocalDate }) {
  const t = useTranslations("privacy.record")
  const [open, setOpen] = useState(false)
  const saving = useIsMutating() > 0

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        {t("open")}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          {open ? <RecordForm today={today} onDone={() => setOpen(false)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
