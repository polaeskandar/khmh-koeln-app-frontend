const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"

const RAW = new RegExp(
  String.raw`(?<![\w-])(?:[\w[\]=&:/-]+:)?(?:bg|text|border|ring|fill|stroke|outline|decoration|from|via|to|divide|shadow)-(?:white|black|(?:${PALETTE})-\d{2,3}|\[(?:#|oklch\(|rgba?\(|hsla?\()[^\]]*\])`,
  "g"
)

export function rawColours(source: string): string[] {
  const strings = source.match(/"[^"\n]*"|'[^'\n]*'|`[^`]*`/g) ?? []

  return strings.flatMap((s) => s.match(RAW) ?? [])
}
