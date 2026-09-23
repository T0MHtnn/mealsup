export interface ParsedIngredient {
  name: string
  quantity: string
  unit: string
}

const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 }

// Order matters: longer forms first ("cuillère à soupe" before "c")
const UNIT_PATTERNS: [RegExp, string, number?][] = [
  [/^(?:kilogrammes?|kilos?|kg)\b\.?/i, 'kg'],
  [/^(?:grammes?|gr|g)\b\.?/i, 'g'],
  [/^(?:décilitres?|decilitres?|dl)\b\.?/i, 'cl', 10],
  [/^(?:centilitres?|cl)\b\.?/i, 'cl'],
  [/^(?:millilitres?|ml)\b\.?/i, 'ml'],
  [/^(?:litres?|l)\b\.?/i, 'L'],
  [/^(?:cuill[eè]res?|cuil\.?|c\.?)\s*(?:à|a)\s*(?:soupe|s\.?)\b\.?|^(?:càs|cas|cs|tbsp)\b\.?/i, 'c.à.s'],
  [/^(?:cuill[eè]res?|cuil\.?|c\.?)\s*(?:à|a)\s*(?:caf[ée]|c\.?)(?![a-zà-ÿ])\.?|^(?:càc|cac|cc|tsp)\b\.?/i, 'c.à.c'],
  [/^pinc[ée]es?\b/i, 'pincée'],
  [/^gousses?\b/i, 'gousse'],
  [/^tranches?\b/i, 'tranche'],
  [/^(?:branches?|brins?)\b/i, 'branche'],
  [/^feuilles?\b/i, 'feuille'],
  [/^sachets?\b/i, 'sachet'],
  [/^(?:bouquets?|bottes?)\b/i, 'bouquet'],
  [/^rouleaux?\b/i, 'rouleau'],
]

function parseNumber(text: string): number | null {
  const t = text.trim()
  if (FRACTIONS[t] !== undefined) return FRACTIONS[t]
  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3])
  const frac = t.match(/^(\d+)\/(\d+)$/)
  if (frac) return Number(frac[1]) / Number(frac[2])
  const n = parseFloat(t.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

/** "200 g de farine" -> { quantity: '200', unit: 'g', name: 'Farine' } ; "Sel, poivre" -> à goût. */
export function parseIngredientLine(line: string): ParsedIngredient {
  let rest = line.replace(/\s+/g, ' ').trim()
  let quantity: number | null = null

  const qty = rest.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?|[½¼¾⅓⅔])(?:\s*(?:à|-)\s*\d+(?:[.,]\d+)?)?\s*/)
  if (qty) {
    quantity = parseNumber(qty[1])
    rest = rest.slice(qty[0].length)
  }

  let unit = ''
  for (const [re, u, factor] of UNIT_PATTERNS) {
    const m = rest.match(re)
    // a lone "g" or "l" must be followed by a space/end ("g de farine"), not start a word ("gousse")
    if (m && (m[0].length > 1 || /^\S(\s|$)/.test(rest))) {
      unit = u
      if (factor && quantity !== null) quantity *= factor
      rest = rest.slice(m[0].length).trim()
      break
    }
  }

  // "de farine", "d'huile"
  rest = rest.replace(/^(?:de|d'|d’|du|des)\s*/i, '').trim()

  if (quantity === null) {
    const toTaste = /\b(sel|poivre|au go[uû]t|selon (?:le|vos) go[uû]ts?)\b/i.test(line)
    return { name: capitalize(rest || line), quantity: '', unit: toTaste ? 'à goût' : '' }
  }
  return {
    name: capitalize(rest || line),
    quantity: String(Math.round(quantity * 100) / 100),
    unit,
  }
}
