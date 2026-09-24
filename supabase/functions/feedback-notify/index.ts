// Supabase Edge Function — prévient les admins d'un nouveau message (section Contact du profil)
//
// Appelée par le trigger feedback_notify (schema.sql) à chaque INSERT dans la table feedback
// (voir supabase/functions/README.md). Envoie :
//   - une notification push sur les appareils où un admin a activé les notifications ;
//   - un e-mail, seulement si les secrets SMTP_USER et SMTP_PASS sont définis.
//
// Secrets requis : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET (déjà
// utilisés par expiry-notifications). Facultatifs, pour l'e-mail : SMTP_USER (adresse Gmail),
// SMTP_PASS (mot de passe d'application Gmail), NOTIFY_EMAIL (destinataire, par défaut
// l'adresse des admins).

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'
import nodemailer from 'npm:nodemailer@6.9.16'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')
const SMTP_USER = Deno.env.get('SMTP_USER')
const SMTP_PASS = Deno.env.get('SMTP_PASS')
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL')

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@mealsup.app',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const preview = (text: string, max: number) => {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

Deno.serve(async (req) => {
  if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }

  const payload = await req.json().catch(() => null)
  const feedbackId = payload?.record?.id
  if (payload?.type !== 'INSERT' || payload?.table !== 'feedback' || !feedbackId) {
    return Response.json({ skipped: true })
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  // The message is read back from the database rather than trusted from the call
  const { data: feedback, error: feedbackError } = await db
    .from('feedback')
    .select('id, email, message, created_at')
    .eq('id', feedbackId)
    .maybeSingle()
  if (feedbackError) return Response.json({ error: feedbackError.message }, { status: 500 })
  if (!feedback) return Response.json({ skipped: true })

  const { data: admins, error: adminsError } = await db.from('users').select('id, email').eq('role', 'admin')
  if (adminsError) return Response.json({ error: adminsError.message }, { status: 500 })
  if (!admins?.length) return Response.json({ sent: 0 })

  const from = feedback.email || 'un membre'
  let pushed = 0

  // ---- Notification push ----
  const { data: subs } = await db
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', admins.map((a) => a.id))
  const notification = JSON.stringify({
    title: 'Nouveau message sur MealsUp',
    body: `De ${from} : ${preview(feedback.message, 120)}`,
    url: '/admin/feedbacks',
    tag: `feedback-${feedback.id}`,
  })
  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, notification)
      pushed++
    } catch (err) {
      // Device unsubscribed or app uninstalled: forget it
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await db.from('push_subscriptions').delete().eq('id', sub.id)
      } else {
        console.error('Push error:', err?.statusCode, err?.body)
      }
    }
  }

  // ---- E-mail (facultatif) ----
  let emailed = false
  const recipients = NOTIFY_EMAIL || admins.map((a) => a.email).filter(Boolean).join(', ')
  if (SMTP_USER && SMTP_PASS && recipients) {
    try {
      // Port 465 (SSL) : les ports 25 et 587 sont bloqués depuis les Edge Functions
      const transport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
      const date = new Date(feedback.created_at).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
      await transport.sendMail({
        from: `MealsUp <${SMTP_USER}>`,
        to: recipients,
        replyTo: feedback.email || undefined,
        subject: `Nouveau message de ${from}`,
        text: `Message reçu le ${date}, de ${from} :\n\n${feedback.message}\n\nÀ lire aussi dans l'app : mode administrateur → Feedbacks.`,
        html: `<div style="font-family:Arial,sans-serif;color:#22301F;max-width:560px">
  <p style="margin:0 0 4px;font-size:13px;color:#5B6B57">Message reçu le ${escapeHtml(date)}</p>
  <p style="margin:0 0 12px;font-size:15px">De <strong>${escapeHtml(from)}</strong> :</p>
  <div style="white-space:pre-wrap;background:#FBF8F2;border:1px solid #E6DFCF;border-radius:10px;padding:14px;font-size:15px;line-height:1.5">${escapeHtml(feedback.message)}</div>
  <p style="margin:14px 0 0;font-size:13px;color:#5B6B57">${feedback.email ? 'Réponds directement à cet e-mail pour lui écrire. ' : ''}À lire aussi dans l'app : mode administrateur → Feedbacks.</p>
</div>`,
      })
      emailed = true
    } catch (err) {
      console.error('Email error:', err)
    }
  }

  return Response.json({ pushed, emailed })
})
