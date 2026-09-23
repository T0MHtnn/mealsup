/**
 * Small data cache shared by all pages:
 * - the same request made by several components at once is sent only once;
 * - a result is reused for `ttlMs`, so going back to a page is instant;
 * - with `persist`, it is also kept on the device (localStorage) so the app
 *   starts without re-downloading it.
 * Every write in the app invalidates the matching entries (see supabaseClient.ts).
 */

interface Entry {
  at: number
  value?: unknown
  promise?: Promise<unknown>
}

const memory = new Map<string, Entry>()
const STORAGE_PREFIX = 'mealsup.cache.'

function readPersisted(key: string): Entry | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    return raw ? (JSON.parse(raw) as Entry) : null
  } catch {
    return null
  }
}

function writePersisted(key: string, entry: Entry) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify({ at: entry.at, value: entry.value }))
  } catch {
    // storage full or unavailable: the memory cache still works
  }
}

export function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>, persist = false): Promise<T> {
  const now = Date.now()
  let entry = memory.get(key)
  if (!entry && persist) {
    const stored = readPersisted(key)
    if (stored) {
      entry = stored
      memory.set(key, stored)
    }
  }
  if (entry?.promise) return entry.promise as Promise<T>
  if (entry && 'value' in entry && now - entry.at < ttlMs) return Promise.resolve(entry.value as T)

  const promise = loader()
    .then((value) => {
      const fresh = { at: Date.now(), value }
      memory.set(key, fresh)
      if (persist) writePersisted(key, fresh)
      return value
    })
    .catch((err) => {
      memory.delete(key)
      throw err
    })
  memory.set(key, { at: now, promise })
  return promise
}

/** Cached value if already loaded (no request). */
export function peek<T>(key: string): T | undefined {
  const entry = memory.get(key) ?? readPersisted(key) ?? undefined
  return entry && 'value' in entry ? (entry.value as T) : undefined
}

/** Forget every entry whose key starts with `prefix` (after a change). */
export function invalidate(prefix: string) {
  for (const key of [...memory.keys()]) if (key.startsWith(prefix)) memory.delete(key)
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(STORAGE_PREFIX + prefix)) localStorage.removeItem(key)
    }
  } catch {
    // ignore
  }
}

/** On sign-out: nothing from the previous account must remain. */
export function clearCache() {
  invalidate('')
}
