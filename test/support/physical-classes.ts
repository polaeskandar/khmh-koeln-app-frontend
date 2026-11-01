const PHYSICAL =
  /(?<![\w-])(?:[\w[\]=&:-]+:)?-?(?:(?:m|p|scroll-m|scroll-p|border|rounded|inset)-?[lr]|rounded-[tb][lr]|left|right)-[\w.[\]/%()-]+|(?<![\w-])(?:[\w[\]=&:-]+:)?(?:text|float|clear)-(?:left|right)(?![\w-])|(?<![\w-])(?:[\w[\]=&:-]+:)?(?:border|rounded)-[lr](?![\w-])/g

export function physicalClasses(source: string): string[] {
  const strings = source.match(/"[^"\n]*"|'[^'\n]*'|`[^`]*`/g) ?? []

  return strings.flatMap((s) => s.match(PHYSICAL) ?? [])
}
