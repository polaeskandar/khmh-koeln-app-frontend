export function focusFirstInvalid(container: HTMLElement | null) {
  container?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}
