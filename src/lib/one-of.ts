export function oneOf<T extends string | number>(
  options: readonly T[],
  value: unknown
): T | undefined {
  return options.find((option) => option === value)
}
