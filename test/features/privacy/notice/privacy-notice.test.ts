import { describe, expect, test } from "vitest"

import {
  PRIVACY_NOTICE_VERSION,
  parsePrivacyNotice,
} from "@/features/privacy/notice/privacy-notice"

const notice = (status: string, body = "## Who is responsible\n\nThe church office.") =>
  `---\nversion: ${PRIVACY_NOTICE_VERSION}\nstatus: ${status}\n---\n\n${body}\n`

describe("parsePrivacyNotice", () => {
  test("reads headings, lists and paragraphs", () => {
    expect(
      parsePrivacyNotice(notice("draft", "## Why\n\n- One\n- Two\n  lines\n\nText.")).blocks
    ).toEqual([
      { kind: "heading", text: "Why" },
      { kind: "list", items: ["One", "Two lines"] },
      { kind: "paragraph", text: "Text." },
    ])
  })

  test("a final notice can't keep a bracketed placeholder", () => {
    expect(() => parsePrivacyNotice(notice("final", "Ask [the church office]."))).toThrow(
      /placeholder \[the church office\]/
    )

    expect(parsePrivacyNotice(notice("draft", "Ask [the church office].")).status).toBe("draft")
    expect(parsePrivacyNotice(notice("final")).status).toBe("final")
  })

  test("rejects another version or status", () => {
    expect(() =>
      parsePrivacyNotice(notice("draft").replace(PRIVACY_NOTICE_VERSION, "2025-01"))
    ).toThrow(/version 2025-01/)

    expect(() => parsePrivacyNotice(notice("published"))).toThrow(/draft or final/)
  })
})
