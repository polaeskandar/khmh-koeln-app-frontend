# UI conventions

How every screen loads, fails and talks back, so they all behave alike. The UI prototype is the reference
for layout and wording.

## Page states

A screen's main data comes from one query, rendered through `QueryState` (`src/components/page-states.tsx`):

| State         | Shows                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| First load    | The page's skeleton (`PageLoading`)                                                                                 |
| Data          | The screen; it stays visible while the query refetches, even if that refetch fails                                  |
| 404           | `NotFoundState`, the same for a missing, deleted or malformed id (`RecordPage` catches the last before any request) |
| 403           | `NoAccess`: the role doesn't allow it                                                                               |
| Anything else | `QueryErrorState`: "This couldn't be loaded.", the problem in words, and "Try again", which refetches               |

A screen that crashes while rendering shows `[locale]/error.tsx`, whose button renders it again. Unknown
addresses get `[locale]/not-found.tsx`, or `out/404.html` (`app/not-found.tsx`, in all three languages)
when the host can't tell the language.

## Empty lists

An empty list is a state of its own, with shadcn's `Empty`: what would be here, and the action that adds
the first item if the viewer may take it. A search without matches says so and offers "Clear search".

## Feedback for actions

Changes go through `useApiMutation` (`docs/architecture.md`, Data access):

- **Field errors (422)** appear inline under their fields, never as a toast. After a 422, focus moves to the
  first invalid field (`useFocusFirstInvalid`, which `FormDialog` uses, #10). A field is a `TextField`,
  `TextAreaField`, `SelectField` or `FormField` (`src/components/form-fields.tsx`), which make its error, or
  else its hint, the control's description.
- **Everything else that fails** (403, 409, 5xx, no connection) is an error toast with the problem in words,
  e.g. "Choir has meeting history (12 sessions). Archive it instead of deleting it." A screen that shows the
  problem itself (the sign-in form's alert) turns the toast off.
- **Success** is a `toast.success` with a short past-tense text from `toast.*` ("Archived Choir."), or no
  toast when the result is visible on the page anyway.
- A 401 `auth.unauthenticated` gets no toast: the session ends and the person signs in again (#14).

## Dialogs

A dialog stays open until its action succeeds: while it runs, its buttons are disabled and Escape does
nothing; on failure it stays open with the problem shown, so nothing typed is lost. Destructive actions use
`ConfirmDialog` with the destructive tone and say what happens; actions that need a reason use
`ReasonDialog` (#10).

A dialog with fields is a `FormDialog` (`src/components/form-dialog.tsx`): the title and description, the form,
Cancel and the submit button with its spinner. It is rendered by the component that owns the change, and that
component sits in a `DialogMount` (`src/components/dialog-mount.tsx`): `<DialogMount open={open}><ServiceDialog
onClose={…} /></DialogMount>`. The mount renders it when the dialog opens, keeps it while the dialog fades out
(Radix keeps the closing content until its animation ends, then calls `onCloseAutoFocus`) and unmounts it after
that, so every opening starts from a fresh form, the dialog is locked by the pending state of its own change, and
closing still fades. Enter in a field submits it; Enter in a search box (`ignoreEnter`) doesn't. A consequential
action takes `submitOnEnter={false}`, so only its button starts it: approving an account. `role="alertdialog"`
makes it an alert dialog, as for deleting one's own account.

## Text and direction

Titles people typed sit in `<bdi>` (`PageHeader` does it), longer typed text gets `dir="auto"`, and typed
text inside a sentence is wrapped with `isolate()`. Layouts use logical classes only (`ms-`, `pe-`,
`text-end`); a test rejects physical ones outside `components/ui`.
