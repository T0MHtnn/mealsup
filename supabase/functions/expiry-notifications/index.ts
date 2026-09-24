// Supabase Edge Function — alertes de péremption (notifications push)
//
// Appelée une fois par jour par une tâche planifiée (pg_cron, voir
// supabase/functions/README.md). Pour chaque utilisateur qui a activé les
// alertes : aliments du frigo qui périment aujourd'hui ou demain -> une
// notification avec 1 ou 2 recettes qui les utilisent. Chaque aliment n'est
// signalé qu'une fois (colonne fridge_items.expiry_notified_on).
//
// Secrets requis : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET
// (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement).

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@mealsup.app',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

const STOPWORDS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'd', 'l', 'en', 'au', 'aux', 'et', 'ou', 'a', 'bio', 'frais', 'fraiche', 'fraiches', 'surgele', 'surgeles'])

/** "Courgettes bio" -> "courgette" : first meaningful word, without accents or plural. */
function mainWord(name: string): string {
  const words = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
  const word = words[0] ?? ''
  return word.replace(/(s|x)$/, '')
}

function simplify(text: string) {
  return ` ${text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const now = new Date()
  const today = isoDay(now)
  const tomorrow = isoDay(new Date(now.getTime() + 86_400_000))
  const afterTomorrow = isoDay(new Date(now.getTime() + 2 * 86_400_000))

  const { data: users, error: usersError } = await db.from('users').select('id').eq('notifications_enabled', true)
  if (usersError) return Response.json({ error: usersError.message }, { status: 500 })
  if (!users?.length) return Response.json({ sent: 0 })
  const userIds = users.map((u) => u.id)

  const { data: items, error: itemsError } = await db
    .from('fridge_items')
    .select('id, user_id, food_name, expiry_date, expiry_notified_on')
    .in('user_id', userIds)
    .eq('is_available', true)
    .gte('expiry_date', today)
    .lt('expiry_date', afterTomorrow)
    .is('expiry_notified_on', null)
  if (itemsError) return Response.json({ error: itemsError.message }, { status: 500 })
  if (!items?.length) return Response.json({ sent: 0 })

  const { data: recipes } = await db
    .from('recipes')
    .select('id, title, visibility, created_by, recipe_ingredients(ingredient_name)')
  const { data: subscriptions } = await db
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  const byUser = new Map<string, typeof items>()
  for (const item of items) byUser.set(item.user_id, [...(byUser.get(item.user_id) ?? []), item])

  let sent = 0
  const notifiedIds: string[] = []

  for (const [userId, userItems] of byUser) {
    const subs = (subscriptions ?? []).filter((s) => s.user_id === userId)
    if (subs.length === 0) continue

    // Recipes (public or the user's own) scored by how many expiring items they use
    const words = userItems.map((i) => mainWord(i.food_name)).filter(Boolean)
    const ideas = (recipes ?? [])
      .filter((r) => r.visibility === 'public' || r.created_by === userId)
      .map((r) => {
        const text = simplify((r.recipe_ingredients ?? []).map((i: any) => i.ingredient_name).join(' | '))
        const score = words.filter((w) => new RegExp(` ${w}(s|x)? `).test(text)).length
        return { recipe: r, score }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((x) => x.recipe)

    const names = userItems.map((i) => i.food_name)
    const expiresToday = userItems.every((i) => String(i.expiry_date).slice(0, 10) === today)
    const when = expiresToday ? "aujourd'hui" : 'demain'
    const list = names.length <= 3 ? names.join(', ') : `${names.slice(0, 3).join(', ')} et ${names.length - 3} ${names.length - 3 > 1 ? 'autres' : 'autre'}`
    const title = names.length === 1 ? `${names[0]} à consommer vite` : `${names.length} aliments à consommer vite`
    const idea = ideas.length ? ` Idée : ${ideas.map((r) => r.title).join(' ou ')}.` : ''
    const payload = JSON.stringify({
      title,
      body: `${list} ${names.length === 1 ? 'expire' : 'expirent'} ${when}.${idea}`,
      url: ideas[0] ? `/recipes/${ideas[0].id}` : '/fridge',
      tag: `expiry-${today}`,
    })

    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
        sent++
      } catch (err: any) {
        // Subscription expired or revoked on the device: forget it
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await db.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('Push error', err?.statusCode, err?.body)
        }
      }
    }
    notifiedIds.push(...userItems.map((i) => i.id))
  }

  if (notifiedIds.length) {
    await db.from('fridge_items').update({ expiry_notified_on: today }).in('id', notifiedIds)
  }
  return Response.json({ sent, items: notifiedIds.length, tomorrow })
})
