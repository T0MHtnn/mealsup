const TO_TASTE = 'à goût'

function round(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',')
}

/** "200 g", "1,5 kg", "75 cl", "à goût", "3 unités" (no unit = number of items). */
export function formatAmount(quantity: number | null | undefined, unit?: string | null): string {
  const u = (unit || '').trim()
  if (u === TO_TASTE) return TO_TASTE
  const q = Number(quantity)
  if (!Number.isFinite(q) || q <= 0) return u
  if (!u) return `${round(q)} ${unitLabel('unité', q)}`
  if (u === 'g' && q >= 1000) return `${round(q / 1000)} kg`
  if (u === 'ml' && q >= 1000) return `${round(q / 1000)} L`
  if (u === 'cl' && q >= 100) return `${round(q / 100)} L`
  return `${round(q)} ${unitLabel(u, q)}`
}

// Counted units get a plural ("2 unités", "3 gousses"); measures stay as is ("2 c.à.s", "500 g")
const COUNTED_UNITS: Record<string, string> = {
  pièce: 'unité',
  pièces: 'unité',
  unité: 'unité',
  gousse: 'gousse',
  tranche: 'tranche',
  branche: 'branche',
  feuille: 'feuille',
  sachet: 'sachet',
  bouquet: 'bouquet',
  rouleau: 'rouleau',
  verre: 'verre',
  pincée: 'pincée',
  dose: 'dose',
  botte: 'botte',
}

function unitLabel(unit: string, quantity: number): string {
  const singular = COUNTED_UNITS[unit]
  if (!singular) return unit
  const plural = singular === 'rouleau' ? 'rouleaux' : `${singular}s`
  return quantity > 1 ? plural : singular
}

export function isToTaste(unit?: string | null) {
  return (unit || '').trim() === TO_TASTE
}
