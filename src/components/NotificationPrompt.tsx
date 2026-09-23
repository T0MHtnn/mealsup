import { useEffect, useState } from 'react'
import { BellRing, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { userService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { enablePush, pushSupport } from '@/utils/push'

/**
 * Asked once (first visit after creating the account): does the user want an
 * alert when a fridge item is about to expire? Can be changed later in Profile.
 */
export default function NotificationPrompt() {
  const { t } = useTranslation()
  const userId = useAuthStore((state) => state.session?.user.id)
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const support = pushSupport()

  useEffect(() => {
    if (!userId || support === 'unsupported' || support === 'not-configured') return
    userService
      .getUserPreferences(userId)
      .then((prefs) => setVisible(!prefs?.notifications_asked))
      .catch(() => undefined)
  }, [userId, support])

  if (!visible || !userId) return null

  const answer = async (wantsIt: boolean) => {
    if (!wantsIt) {
      setVisible(false)
      await userService.updatePreferences(userId, { notifications_asked: true, notifications_enabled: false }).catch(() => undefined)
      return
    }
    setBusy(true)
    const result = await enablePush(userId)
    setBusy(false)
    if (result === 'enabled') setVisible(false)
    else setMessage(result === 'denied' ? t('notifications.denied') : t('notifications.error'))
  }

  return (
    <div className="mb-4 bg-tint-sand border border-border rounded-md p-3">
      <div className="flex items-start gap-2">
        <BellRing size={18} className="text-accent shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-display font-semibold text-ink">{t('notifications.promptTitle')}</p>
          <p className="text-xs text-ink-muted">{t('notifications.promptBody')}</p>
          {support === 'needs-install' ? (
            <p className="text-xs text-ink">{t('notifications.needsInstall')}</p>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => answer(true)}
                disabled={busy}
                className="px-3 py-1.5 bg-primary text-white rounded-full text-sm font-display font-semibold disabled:opacity-50"
              >
                {t('notifications.enable')}
              </button>
              <button onClick={() => answer(false)} className="px-3 py-1.5 border border-border rounded-full text-sm text-ink">
                {t('notifications.noThanks')}
              </button>
            </div>
          )}
          {message && <p className="text-xs text-danger">{message}</p>}
        </div>
        <button
          onClick={() => (support === 'needs-install' ? setVisible(false) : answer(false))}
          aria-label={t('notifications.dismiss')}
          className="p-1 text-ink-muted shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
