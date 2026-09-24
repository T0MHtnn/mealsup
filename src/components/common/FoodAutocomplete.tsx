import { useMemo, useState } from 'react'
import { Refrigerator } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { FOOD_CATEGORIES, GENERIC_FOODS, GROCERY_CATALOG } from '@/constants/groceryCatalog'
import { normalizeText } from '@/utils/text'
import { classifyGroceryItem } from '@/utils/groceryCategory'
import { ingredientKey } from '@/utils/ingredients'

// Clean names to pick from: generic foods first (« Œufs »), then the food products of the shopping catalog
const FOOD_NAMES = Array.from(
  new Set(FOOD_CATEGORIES.flatMap((cat) => [...(GENERIC_FOODS[cat] ?? []), ...GROCERY_CATALOG[cat]]))
)

/** "Œufs" / "oeuf", "Pommes de terre" / "pomme de" compare equal: no accents, œ -> oe, no plural s/x. */
function comparable(text: string) {
  return normalizeText(text)
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .split(/[\s'’-]+/)
    .filter(Boolean)
    .map((word) => word.replace(/(s|x)$/, ''))
    .join(' ')
}

/** Name to save: the catalog spelling when it is the same product ("oeuf" -> "Œufs", "riz" -> "Riz"). */
export function canonicalFoodName(text: string): string {
  const trimmed = text.trim()
  const key = comparable(trimmed)
  const known = FOOD_NAMES.find((name) => comparable(name) === key)
  return known ?? trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

interface FoodAutocompleteProps {
  value: string
  onChange: (value: string) => void
  /** A suggestion was picked (click, or Enter on the highlighted one). */
  onSelect: (name: string) => void
  placeholder: string
  /** Ingredient keys already in the fridge, to flag them in the list. */
  existingKeys?: Set<string>
}

/** Text field with food suggestions ("ri" -> Riz, Riz basmati…) to avoid typos and duplicates. */
export default function FoodAutocomplete({ value, onChange, onSelect, placeholder, existingKeys }: FoodAutocompleteProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)

  const suggestions = useMemo(() => {
    const query = comparable(value.trim())
    if (!query) return []
    // A word of the name must start with what was typed ("tom" -> Tomates, Conserve de tomates; "ri" -> Riz, not Surimi)
    const matches = FOOD_NAMES.filter((name) =>
      comparable(name)
        .split(' ')
        .some((_, i, words) => words.slice(i).join(' ').startsWith(query))
    )
    // Names starting with what was typed come first, then shorter names
    matches.sort((a, b) => {
      const aStarts = comparable(a).startsWith(query) ? 0 : 1
      const bStarts = comparable(b).startsWith(query) ? 0 : 1
      return aStarts - bStarts || a.length - b.length
    })
    // Hide the list once the exact name has been chosen
    if (matches.length === 1 && comparable(matches[0]) === query) return []
    return matches.slice(0, 6)
  }, [value])

  const showList = open && suggestions.length > 0

  const pick = (name: string) => {
    onSelect(name)
    setOpen(false)
    setHighlighted(0)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(suggestions[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setHighlighted(0)
        }}
        onFocus={() => setOpen(true)}
        // Delay so that a tap on a suggestion is registered before the list closes
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        autoCapitalize="sentences"
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        required
        className="w-full px-3 py-2 border border-border rounded-sm bg-surface-200 text-ink"
      />
      {showList && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 w-full bg-surface-200 border border-border rounded-sm shadow-lg overflow-hidden"
        >
          {suggestions.map((name, i) => {
            const inFridge = existingKeys?.has(ingredientKey(name))
            return (
              <li key={name} role="option" aria-selected={i === highlighted}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(name)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                    i === highlighted ? 'bg-tint-sage' : ''
                  }`}
                >
                  <span className="text-ink">{name}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {inFridge && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary">
                        <Refrigerator size={11} />
                        {t('fridge.inFridge')}
                      </span>
                    )}
                    <span className="text-[11px] text-ink-muted">{classifyGroceryItem(name)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
