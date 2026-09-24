import type { TranslationKey } from '@/i18n/translations'

// Supabase Auth error codes -> message shown to the user (the raw messages are in English)
const BY_CODE: Record<string, TranslationKey> = {
  invalid_credentials: 'auth.error.invalidCredentials',
  email_not_confirmed: 'auth.error.emailNotConfirmed',
  user_already_exists: 'auth.error.alreadyExists',
  email_exists: 'auth.error.alreadyExists',
  weak_password: 'auth.error.weakPassword',
  email_address_invalid: 'auth.error.invalidEmail',
  over_email_send_rate_limit: 'auth.error.tooManyEmails',
  over_request_rate_limit: 'auth.error.tooManyRequests',
  signup_disabled: 'auth.error.signupDisabled',
}

/** Translation key for an auth error, falling back to a generic message. */
export function authErrorKey(error: unknown): TranslationKey {
  const code = (error as { code?: string } | null)?.code
  if (code && BY_CODE[code]) return BY_CODE[code]
  const message = String((error as { message?: string } | null)?.message || '').toLowerCase()
  if (message.includes('not confirmed')) return 'auth.error.emailNotConfirmed'
  if (message.includes('invalid login')) return 'auth.error.invalidCredentials'
  if (message.includes('already registered')) return 'auth.error.alreadyExists'
  if (message.includes('rate limit')) return 'auth.error.tooManyEmails'
  return 'auth.error.generic'
}
