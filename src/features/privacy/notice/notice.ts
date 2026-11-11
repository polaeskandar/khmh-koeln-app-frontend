import { readFileSync } from "node:fs"
import { join } from "node:path"

import type { Locale } from "@/i18n/config"
import { parsePrivacyNotice } from "./privacy-notice"

const privacyNoticeFile = (locale: Locale) =>
  join(process.cwd(), "src/content/privacy", `${locale}.md`)

export const readPrivacyNotice = (locale: Locale) =>
  parsePrivacyNotice(readFileSync(privacyNoticeFile(locale), "utf8"))
