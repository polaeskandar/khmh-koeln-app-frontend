import { expect, test } from "vitest"

import {
  ACCOUNT_REQUEST_QUERIES,
  MEMBER_ACCOUNT_QUERIES,
  STAFF_ACCOUNT_QUERIES,
  STAFF_APPROVAL_QUERIES,
} from "@/features/identity/accounts/api"
import { refetchedBy } from "@test/support/queries"

test("a declined account request refetches the requests", () => {
  expect(refetchedBy(ACCOUNT_REQUEST_QUERIES)).toEqual(["accountRequests", "memberCandidates"])
})

test("a staff approval refetches the requests, the staff accounts, the roles and the guardian links", () => {
  expect(refetchedBy(STAFF_APPROVAL_QUERIES)).toEqual([
    "accountRequests",
    "memberCandidates",
    "staffAccounts",
    "roles",
    "role",
    "guardianLinks",
  ])
})

test("a member account change refetches the member accounts and the requests", () => {
  expect(refetchedBy(MEMBER_ACCOUNT_QUERIES)).toEqual([
    "accountRequests",
    "memberCandidates",
    "memberAccounts",
  ])
})

test("a staff account changed meanwhile refetches the staff accounts", () => {
  expect(refetchedBy(STAFF_ACCOUNT_QUERIES)).toEqual(["staffAccounts"])
})
