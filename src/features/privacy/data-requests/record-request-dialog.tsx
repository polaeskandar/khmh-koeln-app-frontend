"use client"

import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"

import { DialogMount } from "@/components/dialog-mount"
import { FormDialog } from "@/components/form-dialog"
import { SelectField, TextAreaField, TextField } from "@/components/form-fields"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelectOption } from "@/components/ui/native-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { guardianLinksQuery } from "@/features/people/guardians/api"
import { peopleQuery } from "@/features/people/members/api"
import { ignoreEnter } from "@/features/people/members/person-search"
import { useDebounced } from "@/hooks/use-debounced"
import { useRouter } from "@/i18n/navigation"
import type { LocalDate } from "@/lib/api/types/common"
import { useApiMutation } from "@/lib/api/use-api-mutation"
import { fold, preferredName } from "@/lib/domain/names"
import { oneOf } from "@/lib/one-of"
import { routes } from "@/lib/routes"

import {
  type RecordDataRequest,
  recordDataRequest,
  type RequestKind,
  DATA_REQUEST_QUERIES,
} from "./api"

const CHANNELS = ["email", "letter", "in_person"] as const

const KINDS: RequestKind[] = ["erasure", "copy"]

const ABOUTS = ["member", "account"] as const

type About = (typeof ABOUTS)[number]

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
  about: About
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

  const accounts = useQuery({ ...guardianLinksQuery, enabled: about === "account" })

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
        onKeyDown={ignoreEnter}
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

function RecordRequestDialog({ today, onClose }: { today: LocalDate; onClose: () => void }) {
  const t = useTranslations()
  const router = useRouter()
  const id = useId()
  const [kind, setKind] = useState<RequestKind>("erasure")
  const [about, setAbout] = useState<About>("member")
  const [subject, setSubject] = useState<string | null>(null)
  const [requestedBy, setRequestedBy] = useState("")
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("email")
  const [receivedOn, setReceivedOn] = useState(today)
  const [note, setNote] = useState("")

  const record = useApiMutation(recordDataRequest, {
    successMessage: t("toast.dataRequestRecorded"),
    invalidate: DATA_REQUEST_QUERIES,
    onSuccess: (saved) => {
      onClose()
      router.push(routes.dataRequest(saved.id))
    },
  })

  const errors = record.fieldErrors

  function submit() {
    const input: RecordDataRequest = {
      kind,
      subject: about === "member" ? { personId: subject } : { accountId: subject },
      receipt: { requestedBy, channel, receivedOn },
      ...(note.trim() ? { note } : {}),
    }

    void record.execute(input)
  }

  return (
    <FormDialog
      title={t("privacy.record.title")}
      description={t("privacy.record.description")}
      pending={record.pending}
      problem={record.problem}
      submitLabel={t("privacy.record.submit")}
      onSubmit={submit}
      onClose={onClose}
    >
      <FieldGroup>
        <FieldSet>
          <FieldLegend variant="label">{t("privacy.record.kind")}</FieldLegend>
          <RadioGroup
            value={kind}
            onValueChange={(value) => setKind(oneOf(KINDS, value) ?? kind)}
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
              setAbout(oneOf(ABOUTS, value) ?? about)
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
          <SelectField
            label={t("privacy.record.channel")}
            value={channel}
            onChange={(event) => setChannel(oneOf(CHANNELS, event.target.value) ?? channel)}
          >
            {CHANNELS.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {t(`privacy.channel.${value}`)}
              </NativeSelectOption>
            ))}
          </SelectField>
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
    </FormDialog>
  )
}

export function RecordRequestButton({ today }: { today: LocalDate }) {
  const t = useTranslations("privacy.record")
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        {t("open")}
      </Button>
      <DialogMount open={open}>
        <RecordRequestDialog today={today} onClose={() => setOpen(false)} />
      </DialogMount>
    </>
  )
}
