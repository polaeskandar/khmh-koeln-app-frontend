type NextFont = { style: { fontFamily: string } }

export function fontStack(...fonts: NextFont[]): string {
  const families = fonts.map((font) =>
    font.style.fontFamily
      .split(",")
      .map((family) => family.trim())
      .filter(Boolean)
  )

  return [
    ...families.map(([face]) => face),
    ...families.flatMap(([, ...standIns]) => standIns),
    "ui-sans-serif",
    "system-ui",
    "sans-serif",
  ].join(", ")
}
