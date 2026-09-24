import { useEffect, useState } from 'react'
import { authService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { authErrorKey } from '@/utils/authErrors'
import type { TranslationKey } from '@/i18n/translations'

const COOLDOWN_SECONDS = 60

/** "Renvoyer l'e-mail" link, with a pause between two sends (Supabase limits them). */
export default function ResendConfirmation({ email }: { email: string }) {
  const { t } = useTranslation()
  const [wait, setWait] = useState(0)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null)

  useEffect(() => {
    if (wait <= 0) return
    const timer = window.setTimeout(() => setWait((w) => w - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [wait])

  const resend = async () => {
    setStatus('sending')
    setErrorKey(null)
    try {
      await authService.resendConfirmation(email)
      setStatus('sent')
      setWait(COOLDOWN_SECONDS)
    } catch (err) {
      setErrorKey(authErrorKey(err))
      setStatus('idle')
    }
  }

  return (
    <div className="text-sm text-center space-y-1">
      <button
        type="button"
        onClick={resend}
        disabled={!email || status === 'sending' || wait > 0}
        className="font-semibold text-primary disabled:text-ink-muted"
      >
        {wait > 0 ? t('auth.resendIn', { s: wait }) : t('auth.resend')}
      </button>
      {status === 'sent' && <p className="text-xs text-primary">{t('auth.resent')}</p>}
      {errorKey && <p className="text-xs text-danger">{t(errorKey)}</p>}
    </div>
  )
}
