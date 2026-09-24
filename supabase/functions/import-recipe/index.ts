// Supabase Edge Function — importer une recette depuis un lien
//
// Le navigateur ne peut pas lire directement une page d'un autre site (CORS) :
// cette fonction la télécharge, y cherche les données de recette structurées
// (JSON-LD schema.org/Recipe, publiées par la plupart des sites : Marmiton,
// 750g, Cuisine AZ, BBC Good Food...) et renvoie un résultat simplifié.
// Réservée aux utilisateurs connectés : la session envoyée par l'app est
// vérifiée ci-dessous (réglage "Verify JWT" du tableau de bord : OFF).

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/** Is the request made by a signed-in MealsUp user? (the public anon key alone is not enough) */
async function isSignedIn(req: Request): Promise<boolean> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return false
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
  const { data, error } = await supabase.auth.getUser(token)
  return !error && Boolean(data.user)
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

/** Refuse local / private network addresses (the function must only fetch public web pages). */
function isForbiddenHost(hostname: string) {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return true
  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
  }
  return host.includes(':') // IPv6 literals
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', ocirc: 'ô', ecirc: 'ê', icirc: 'î', ucirc: 'û', rsquo: '’', oelig: 'œ' }

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim()
}

/** ISO 8601 duration ("PT1H30M") -> minutes. */
function minutes(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const m = value.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i)
  if (!m) return null
  const total = Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
  return total > 0 ? total : null
}

function servings(value: unknown): number | null {
  const first = Array.isArray(value) ? value[0] : value
  const n = parseInt(String(first ?? ''), 10)
  return Number.isFinite(n) && n > 0 && n < 100 ? n : null
}

function isRecipe(node: any) {
  const type = node?.['@type']
  return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))
}

function findRecipe(node: any): any | null {
  if (!node || typeof node !== 'object') return null
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findRecipe(child)
      if (found) return found
    }
    return null
  }
  if (isRecipe(node)) return node
  for (const key of ['@graph', 'mainEntity', 'itemListElement']) {
    const found = findRecipe(node[key])
    if (found) return found
  }
  return null
}

/** Photo of the recipe: schema.org "image" (text, list or ImageObject), else the page's og:image. */
function image(value: unknown, html: string, base: URL): string | null {
  const first = Array.isArray(value) ? value[0] : value
  const raw =
    (typeof first === 'string' && first) ||
    (first && typeof first === 'object' && typeof (first as any).url === 'string' && (first as any).url) ||
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
  if (!raw) return null
  try {
    const url = new URL(raw.replace(/&amp;/g, '&'), base)
    return url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function steps(value: unknown): string[] {
  if (typeof value === 'string') {
    return cleanText(value)
      .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý])/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (!Array.isArray(value)) return []
  return value.flatMap((item: any) => {
    if (typeof item === 'string') return [cleanText(item)]
    if (item?.['@type'] === 'HowToSection') return steps(item.itemListElement)
    return [cleanText(item?.text ?? item?.name ?? '')]
  }).filter(Boolean)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  if (!(await isSignedIn(req))) return json({ error: 'unauthorized' }, 401)

  let target: URL
  try {
    const { url } = await req.json()
    target = new URL(String(url))
  } catch {
    return json({ error: 'invalid_url' }, 400)
  }
  if (!['http:', 'https:'].includes(target.protocol) || isForbiddenHost(target.hostname)) {
    return json({ error: 'invalid_url' }, 400)
  }

  let html: string
  try {
    const res = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MealsUpRecipeImport/1.0)', Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return json({ error: 'fetch_failed', status: res.status }, 502)
    html = (await res.text()).slice(0, 3_000_000)
  } catch {
    return json({ error: 'fetch_failed' }, 502)
  }

  let recipe: any = null
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      recipe = findRecipe(JSON.parse(match[1].trim()))
    } catch {
      recipe = null
    }
    if (recipe) break
  }
  if (!recipe) return json({ error: 'no_recipe' }, 422)

  const prep = minutes(recipe.prepTime)
  const cook = minutes(recipe.cookTime) ?? (minutes(recipe.totalTime) && prep ? (minutes(recipe.totalTime) as number) - prep : null)

  return json({
    title: cleanText(recipe.name),
    description: cleanText(recipe.description),
    prep_time_mins: prep,
    cook_time_mins: cook && cook > 0 ? cook : null,
    servings: servings(recipe.recipeYield),
    ingredients: (Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : []).map(cleanText).filter(Boolean),
    steps: steps(recipe.recipeInstructions),
    image: image(recipe.image, html, target),
    source: target.href,
  })
})
