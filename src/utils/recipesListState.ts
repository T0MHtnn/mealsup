// Where the member left the recipes list: its search / filters (the URL query) and the
// scroll position. Kept for the browser session, so that coming back from a recipe or
// from another tab shows the list exactly as it was.

const SEARCH_KEY = 'mealsup.recipes.search'
const SCROLL_KEY = 'mealsup.recipes.scroll'

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // storage unavailable: the list simply opens unfiltered
  }
}

/** "?cat=dinner&budget=low", or "" */
export function savedRecipesSearch(): string {
  const search = read(SEARCH_KEY) ?? ''
  return search.startsWith('?') ? search : ''
}

export function saveRecipesSearch(search: string) {
  write(SEARCH_KEY, search)
}

export function savedRecipesScroll(): number {
  return Number(read(SCROLL_KEY)) || 0
}

export function saveRecipesScroll(top: number) {
  write(SCROLL_KEY, String(Math.round(top)))
}
