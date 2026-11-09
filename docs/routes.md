# Routes

Every screen of the MVP and its address. The app is a static export: a page can't be built per record, so a
record's id travels in the query string (`/services/view/?id=…`), and every path ends in a slash. All paths
below sit under the language, `/<locale>/` (`/en/`, `/de/`, `/ar/`). `src/lib/routes.ts` builds them without
the language; `Link` and `useRouter` from `@/i18n/navigation` add it.

`…/stages/:stage` in the prototype stands for `/services/:service/stages/:stage`; the product addresses a
stage by its own id, which already names its service.

## Staff app (`app/[locale]/(staff)`)

| Screen                    | Prototype route                    | Product route                         | Builder                       |
| ------------------------- | ---------------------------------- | ------------------------------------- | ----------------------------- |
| Home (entry point)        | `/`                                | `/`                                   | `home()`                      |
| 01 Dashboard              | `/`                                | `/` (#65)                             | `home()`                      |
| 02 Services overview      | `/services`                        | `/services/`                          | `services()`                  |
| 03 Service details        | `/services/:service`               | `/services/view/?id=`                 | `service(id)`                 |
| 04 Stage management       | `/services/:service/stages`        | `/services/stages/?id=` (the service) | `serviceStages(service)`      |
| Stage page                | `…/stages/:stage`                  | `/stages/view/?id=`                   | `stage(id)`                   |
| 05 Meeting schedules      | `/meetings/schedules`              | `/meetings/schedules/`                | `schedules()`                 |
| A schedule                | –                                  | `/meetings/schedules/view/?id=`       | `schedule(id)`                |
| 06 Meeting sessions       | `/meetings`                        | `/meetings/`                          | `meetings()`                  |
| A session                 | `/meetings/sessions/:session`      | `/meetings/sessions/view/?id=`        | `session(id)`                 |
| Attendance overview       | –                                  | `/attendance/`                        | `attendance()`                |
| 07, 10 Manual attendance  | `/attendance/:session`             | `/attendance/take/?session=`          | `takeAttendance(session)`     |
| 08 Attendance summary     | `/attendance/:session/summary`     | `/attendance/summary/?session=`       | `attendanceSummary(session)`  |
| 09 Members                | `/members`                         | `/members/?q=&group=&status=`         | `members(view?)`              |
| Settings (all sections)   | `/settings`                        | `/settings/`                          | `settings()`                  |
| A new role                | `/settings/roles/new`              | `/settings/roles/new/`                | `newRole()`                   |
| A role                    | `/settings/roles/:role`            | `/settings/roles/view/?id=`           | `role(id)`                    |
| Data protection requests  | `/settings/data-requests`          | `/settings/data-requests/`            | `dataRequests()`              |
| A data protection request | `/settings/data-requests/:request` | `/settings/data-requests/view/?id=`   | `dataRequest(id)`             |
| Your account              | `/account`                         | `/account/`                           | `account()`                   |
| S01 Lessons               | `…/stages/:stage/lessons`          | `/stages/lessons/?id=` (the stage)    | `stageLessons(stage)`         |
| S02 Lesson editor, new    | `…/lessons/new`                    | `/lessons/new/?stage=`                | `newLesson(stage)`            |
| S02 Lesson editor, edit   | `…/lessons/:lesson/edit`           | `/lessons/edit/?id=`                  | `editLesson(id)`              |
| S03 Lesson                | `…/lessons/:lesson`                | `/lessons/view/?id=`                  | `lesson(id)`                  |
| S04 Homework              | `…/stages/:stage/homework`         | `/stages/homework/?id=` (the stage)   | `stageHomework(stage)`        |
| Stage attendance          | `…/stages/:stage/attendance`       | `/stages/attendance/?id=` (the stage) | `stageAttendance(stage)`      |
| S05 Homework editor, new  | `…/homework/new?lesson=`           | `/homework/new/?stage=&lesson=`       | `newHomework(stage, lesson?)` |
| S05 Homework editor, edit | `…/homework/:homework/edit`        | `/homework/edit/?id=`                 | `editHomework(id)`            |
| S06 Homework progress     | `…/homework/:homework`             | `/homework/view/?id=`                 | `homework(id)`                |

The members list keeps its search (`q`), group filter (`group`, `service:<id>` or `stage:<id>`) and tab
(`status`, `inactive` or `all`) in the address, as the schedules list keeps its tab, so a refresh, Back and a
shared link show the same list. Defaults are left out; typing replaces the address after the search delay
instead of adding a history entry per letter.

## Parent portal (`app/[locale]/parent`)

| Screen                 | Prototype route                     | Product route                       | Builder                          |
| ---------------------- | ----------------------------------- | ----------------------------------- | -------------------------------- |
| P01, P06 Home          | `/parent`                           | `/parent/`                          | `parentHome()`                   |
| P02 My children        | `/parent/children`                  | `/parent/children/`                 | `parentChildren()`               |
| P03 Homework           | `/parent/homework?child=`           | `/parent/homework/?child=`          | `parentHomework(child?)`         |
| P04, P05 Homework task | `/parent/homework/:homework?child=` | `/parent/homework/view/?id=&child=` | `parentHomeworkTask(id, child?)` |
| P07 Account and data   | `/parent/account`                   | `/parent/account/`                  | `parentAccount()`                |

## Member portal (`app/[locale]/member`)

| Screen        | Prototype route        | Product route                | Builder                  |
| ------------- | ---------------------- | ---------------------------- | ------------------------ |
| Home          | `/member`              | `/member/`                   | `memberHome()`           |
| Homework      | `/member/homework`     | `/member/homework/`          | `memberHomework()`       |
| Homework task | `/member/homework/:id` | `/member/homework/view/?id=` | `memberHomeworkTask(id)` |
| Account       | `/member/account`      | `/member/account/`           | `memberAccount()`        |

Accounts linked to a member record (`me.member`) may enter. Staff and parents get "My groups" in their
account menu while `me.member.groupCount > 0`.

## Before signing in (`app/[locale]/(public)`)

| Screen               | Prototype route    | Product route                 | Builder                    |
| -------------------- | ------------------ | ----------------------------- | -------------------------- |
| Sign in              | `/sign-in`         | `/sign-in/?next=`             | `signIn(next?)`            |
| Waiting for approval | `/sign-in/pending` | `/sign-in/pending/`           | `signInPending()`          |
| Confirm email first  | –                  | `/sign-in/unconfirmed/`       | `signInUnconfirmed()`      |
| Erasure scheduled    | –                  | `/sign-in/erasure-scheduled/` | `signInErasureScheduled()` |
| Register             | `/register`        | `/register/`                  | `register()`               |
| Registered           | `/register/done`   | `/register/done/`             | `registered()`             |
| Forgot password      | `/forgot-password` | `/forgot-password/`           | `forgotPassword()`         |
| Set a password       | –                  | `/set-password/#token=`       | `setPassword(token)`       |
| Confirm email        | –                  | `/confirm-email/#token=`      | –                          |
| Download your data   | –                  | `/data-copy/#token=`          | –                          |
| Privacy notice       | `/privacy`         | `/privacy/`                   | `privacy()`                |

The prototype's demo sign-in (`/sign-in/demo`) has no product route.

- `next` is the full path to return to, with its language (`/en/members/`); only `/en/`, `/de/` and `/ar/`
  paths are followed (#14).
- `/set-password/#token=…` is the one-time link the church office hands out (backend #30, #81). The token
  sits in the fragment, so it never reaches a server or its logs.
- `/confirm-email/#token=…` is the link the registration email carries (backend #84). The page confirms the
  address once and removes the token from the address. Signing in before that opens `/sign-in/unconfirmed/`
  (`auth.unconfirmed`, backend #313); after it, `/sign-in/pending/` until the office approves the account.
- `/sign-in/erasure-scheduled/` opens right after an account asked for its own erasure (the request ends every
  session) or when signing in answers 403 `auth.erasureScheduled` (backend #315). It shows the date the account
  is erased and cancels the erasure with the email address and password. Like the waiting and confirm-first
  pages, it is the 404 page unless one of those outcomes just led there.
- `/data-copy/#token=…` is the one-time link to a copy of someone's data, which the office creates on the data
  protection request (backend #315). The page removes the token from the address at once and downloads the
  file only when the person presses the button, so a link preview can't spend the link.

## Entry points

- `/` picks the language (#8) and opens `/<locale>/`.
- `/<locale>/` is the staff home. It will replace itself with `/<locale>/attendance/` once the attendance
  overview exists (#47), until the dashboard (#65) takes its place.
- Parents start at `/<locale>/parent/`, and accounts with only a member record at `/<locale>/member/`.
  The guards (#14, #90) send each account to its area; an account with none sees "No role yet".
- Signed out, every guarded page sends people to `/<locale>/sign-in/?next=…`.

## A page for one record

The page reads its id with `useSearchParamId(name)` (`src/hooks/use-search-param-id.ts`), which accepts only a
UUID. `RecordPage` (`src/components/record-page.tsx`) wraps the screen in the Suspense boundary that
`useSearchParams` needs in a static export, and shows the page's not-found fallback for a missing or malformed
id without asking the API:

```tsx
<RecordPage notFound={<NotFoundState />}>{(id) => <ServiceScreen id={id} />}</RecordPage>
```

## The page template

Route groups: `(staff)` and `(public)` don't appear in the URL; `parent` does. Each `page.tsx` is small and
server-rendered at build time; the screen itself is one client component in `src/features/<context>/<resource>/`:

```tsx
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { ServiceDetails } from "@/features/organization/services/service-details"
import { pageLocale } from "@/i18n/page"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services/view">): Promise<Metadata> {
  const t = await getTranslations({ locale: await pageLocale(params), namespace: "services" })
  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/services/view">) {
  await pageLocale(params)
  return <ServiceDetails />
}
```

`pageLocale(params)` reads the language and calls `setRequestLocale`, which next-intl needs before any of its
server functions run.
