export type Place = { service: { name: string }; stage: { name: string } | null }

export function placeLabel({ service, stage }: Place) {
  return stage ? `${service.name} · ${stage.name}` : service.name
}
