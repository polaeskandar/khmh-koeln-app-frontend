import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { apiUrl, problem } from "@test/support/api"
import { services } from "@test/support/fixtures/services"
import { stageRef } from "@test/support/fixtures/sessions"
import { server } from "@test/support/msw"
import { renderWithProviders } from "@test/support/providers"

import type { AccountRequest, MemberCandidate } from "@/features/identity/accounts/api"
import type { Schemas } from "@/lib/api/client"
import { ApproveButton } from "@/features/identity/accounts/approve-dialog"

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(toast, "success")
})

afterEach(() => vi.restoreAllMocks())

const youth = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ec601",
  name: "Youth Meeting",
  tone: 2,
  archived: false,
}

const bible = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ec602",
  name: "Bible Study",
  tone: 3,
  archived: false,
}

const candidate = (
  id: string,
  firstName: string,
  lastName: string,
  extra: Partial<MemberCandidate> = {}
): MemberCandidate => ({
  id,
  firstName,
  lastName,
  displayName: null,
  groups: [],
  hasAccount: false,
  ...extra,
})

const youngMina = candidate("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ec701", "Mina", "Hanna", {
  groups: [{ service: youth, stage: null }],
})

const olderMina = candidate("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ec702", "Mina", "Hanna", {
  groups: [{ service: bible, stage: null }],
})

const nevine = candidate("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ec703", "Nevine", "Boulos", {
  groups: [{ service: bible, stage: stageRef("Level 1", 1) }],
  hasAccount: true,
})

const nevineTwin = candidate("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ec704", "Nevine", "Boulos")

const request = (displayName: string): AccountRequest => ({
  account: {
    id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ec801",
    email: "member@example.org",
    displayName,
    language: "en",
  },
  registeredAt: "2026-11-07T10:00:00Z",
  registeredAs: "member",
  note: "Youth Meeting and Deacons’ School",
  services: [],
})

function open(
  name: string,
  items: MemberCandidate[],
  approve: () => Response = () => HttpResponse.json(request(name).account)
) {
  const bodies: unknown[] = []

  server.use(
    http.get(apiUrl("/account-requests/member-candidates"), () => HttpResponse.json({ items })),
    http.post(apiUrl("/account-requests/:id/approve"), async ({ request: req }) => {
      bodies.push(await req.json())

      return approve()
    })
  )

  renderWithProviders(<ApproveButton request={request(name)} />)

  return bodies
}

const openDialog = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Approve…" }))

  return within(await screen.findByRole("dialog"))
}

test("two Mina Hannas: a warning, nothing preselected, and the youth sent with consent", async () => {
  const bodies = open("Mina Hanna", [youngMina, olderMina])
  const dialog = await openDialog()

  expect(dialog.getByRole("textbox", { name: "Find a member by name or group" })).toHaveValue(
    "Mina Hanna"
  )

  expect(await dialog.findByRole("status")).toHaveTextContent(
    "2 people are called ⁨Mina Hanna⁩. Check the groups to choose the right one."
  )

  const radios = dialog.getAllByRole("radio")

  expect(
    radios
      .slice(0, 2)
      .every(
        (radio) =>
          !(radio as HTMLButtonElement).ariaChecked ||
          radio.getAttribute("aria-checked") === "false"
      )
  ).toBe(true)

  const submit = dialog.getByRole("button", { name: "Approve account" })
  expect(submit).toBeDisabled()
  await userEvent.click(radios[0]!)
  expect(submit).toBeDisabled()

  await userEvent.click(
    dialog.getByRole("radio", { name: "Under 16, and a parent or guardian agreed" })
  )

  const note = dialog.getByRole("textbox", { name: "How did they agree? (optional)" })
  expect(note).toHaveAttribute("dir", "auto")
  await userEvent.type(note, "His mother agreed in person.")
  await userEvent.click(submit)
  await waitFor(() => expect(bodies).toHaveLength(1))

  expect(bodies[0]).toEqual({
    as: "member",
    member: {
      personId: youngMina.id,
      ageCheck: "guardianConsent",
      guardianConsentNote: "His mother agreed in person.",
    },
  })
})

test("a record with an account is disabled, and a 422 stays under the list", async () => {
  open("Nevine Boulos", [nevine, nevineTwin], () =>
    problem(422, "validation.failed", {
      fieldErrors: {
        "member.personId": {
          code: "accounts.personHasAccount",
          params: { name: "Nevine Boulos" },
        },
      },
    })
  )

  const dialog = await openDialog()
  const taken = await dialog.findByRole("radio", { name: /Has an account/ })
  expect(taken).toBeDisabled()
  const free = dialog.getAllByRole("radio").find((radio) => !radio.hasAttribute("disabled"))!
  expect(free).toHaveAttribute("aria-checked", "true")
  await userEvent.click(dialog.getByRole("radio", { name: "16 or older" }))
  await userEvent.click(dialog.getByRole("button", { name: "Approve account" }))

  expect(
    await dialog.findByText(
      "Nevine Boulos already has an account. Check that you chose the right person."
    )
  ).toBeInTheDocument()

  expect(screen.getByRole("dialog")).toBeInTheDocument()
})

test("a long note is refused before sending, and 16 or older sends no note", async () => {
  const bodies = open("Mina Hanna", [youngMina])
  const dialog = await openDialog()

  await waitFor(() =>
    expect(dialog.getAllByRole("radio")[0]).toHaveAttribute("aria-checked", "true")
  )

  await userEvent.click(
    dialog.getByRole("radio", { name: "Under 16, and a parent or guardian agreed" })
  )

  const note = dialog.getByRole("textbox", { name: "How did they agree? (optional)" })
  await userEvent.click(note)
  await userEvent.paste("x".repeat(201))
  expect(dialog.getByText("Use at most 200 characters.")).toBeInTheDocument()
  expect(dialog.getByRole("button", { name: "Approve account" })).toBeDisabled()
  await userEvent.click(dialog.getByRole("radio", { name: "16 or older" }))

  expect(
    dialog.queryByRole("textbox", { name: "How did they agree? (optional)" })
  ).not.toBeInTheDocument()

  await userEvent.click(dialog.getByRole("button", { name: "Approve account" }))
  await waitFor(() => expect(bodies).toHaveLength(1))

  expect(bodies[0]).toEqual({
    as: "member",
    member: { personId: youngMina.id, ageCheck: "sixteenOrOlder", guardianConsentNote: null },
  })
})

test("a failed record search says so and retries", async () => {
  let searches = 0
  open("Kirollos Iskander", [])

  server.use(
    http.get(apiUrl("/account-requests/member-candidates"), () =>
      ++searches === 1
        ? problem(429, "tooManyRequests")
        : HttpResponse.json({
            items: [candidate("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ec705", "Kirollos", "Iskander")],
          })
    )
  )

  const dialog = await openDialog()
  await userEvent.click(await dialog.findByRole("button", { name: "Try again" }))
  expect(await dialog.findByRole("radio", { name: /Kirollos Iskander/ })).toBeInTheDocument()
})

describe("a member without a record", () => {
  const sundaySchool = services.items[0]!
  const thirdClass = sundaySchool.stages.find((stage) => stage.name === "3rd Class")!
  const NEW_ID = "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ec901"

  const createdPerson = (): Schemas["CreatedPersonResponse"] => ({
    person: {
      id: NEW_ID,
      firstName: "Kirollos",
      lastName: "Iskander",
      displayName: null,
      status: "active",
    },
    membership: null,
  })

  function withCreate(
    create: () => Response = () => HttpResponse.json(createdPerson(), { status: 201 })
  ) {
    const created: unknown[] = []

    server.use(
      http.get(apiUrl("/services"), () => HttpResponse.json(services)),
      http.post(apiUrl("/people"), async ({ request: req }) => {
        created.push(await req.json())

        return create()
      })
    )

    return created
  }

  async function chooseNewRecord(dialog: ReturnType<typeof within>) {
    await dialog.findByText("No member matches.")
    await userEvent.click(dialog.getByRole("button", { name: /as a new member$/ }))
    await userEvent.selectOptions(await dialog.findByLabelText("Stage"), thirdClass.id)
    await userEvent.click(dialog.getByRole("radio", { name: "16 or older" }))
  }

  test("creates the record with the account's names and the chosen group, then approves with it", async () => {
    const approvals = open("Kirollos Iskander", [])
    const created = withCreate()
    const dialog = await openDialog()
    await chooseNewRecord(dialog)
    expect(dialog.getByLabelText("First name")).toHaveValue("Kirollos")
    expect(dialog.getByLabelText("Last name")).toHaveValue("Iskander")
    await userEvent.click(dialog.getByRole("button", { name: "Approve account" }))
    await waitFor(() => expect(approvals).toHaveLength(1))

    expect(created).toEqual([
      {
        firstName: "Kirollos",
        lastName: "Iskander",
        displayName: null,
        placement: { serviceId: sundaySchool.id, stageId: thirdClass.id },
      },
    ])

    expect(approvals[0]).toEqual({
      as: "member",
      member: { personId: NEW_ID, ageCheck: "sixteenOrOlder", guardianConsentNote: null },
    })
  })

  test("a failed approval retries with the record already made", async () => {
    let answers = 0

    const approvals = open("Kirollos Iskander", [], () =>
      ++answers === 1
        ? problem(429, "auth.tooManyAttempts")
        : HttpResponse.json(request("Kirollos Iskander").account)
    )

    const created = withCreate()
    const dialog = await openDialog()
    await chooseNewRecord(dialog)
    await userEvent.click(dialog.getByRole("button", { name: "Approve account" }))

    expect(
      await dialog.findByText("Too many attempts. Wait a few minutes and try again.")
    ).toBeInTheDocument()

    expect(dialog.getByLabelText("First name")).toBeDisabled()
    expect(dialog.queryByRole("button", { name: "Choose an existing record instead" })).toBeNull()
    await userEvent.click(dialog.getByRole("button", { name: "Approve account" }))
    await waitFor(() => expect(approvals).toHaveLength(2))
    expect(created).toHaveLength(1)

    expect(
      approvals.map((body) => (body as { member: { personId: string } }).member.personId)
    ).toEqual([NEW_ID, NEW_ID])
  })

  test("a namesake asks first, and adding anyway confirms the duplicate", async () => {
    let creates = 0

    const approvals = open("Kirollos Iskander", [])

    const created = withCreate(() =>
      ++creates === 1
        ? problem(409, "people.duplicate", {
            params: { count: 1, name: "Kirollos Iskander" },
            candidates: [],
          })
        : HttpResponse.json(createdPerson(), { status: 201 })
    )

    const dialog = await openDialog()
    await chooseNewRecord(dialog)
    await userEvent.click(dialog.getByRole("button", { name: "Approve account" }))

    await userEvent.click(
      await dialog.findByRole("button", { name: "It’s a different person, add anyway" })
    )

    await waitFor(() => expect(approvals).toHaveLength(1))
    expect(created).toHaveLength(2)
    expect(created[1]).toMatchObject({ confirmDuplicate: true })
  })

  test("going back to the list approves an existing record", async () => {
    const approvals = open("Kirollos Iskander", [])
    withCreate()
    const dialog = await openDialog()
    await chooseNewRecord(dialog)
    await userEvent.click(dialog.getByRole("button", { name: "Choose an existing record instead" }))
    expect(dialog.getByRole("button", { name: "Approve account" })).toBeDisabled()
    expect(approvals).toEqual([])
  })
})
