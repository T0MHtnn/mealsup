import { useEffect, useState } from 'react'
import { BellRing } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from '@/hooks/useTranslation'
import { disablePush, enablePush, isSubscribedHere, pushSupport } from '@/utils/push'

interface NotificationSettingsProps {
  /** Title and explanation (default: the members' expiry alerts). */
  title?: string
  description?: string
}

/** Profile section: turn notifications on/off for this device. */
export default function NotificationSettings({ title, description }: NotificationSettingsProps = {}) {
  const { t } = useTranslation()
  const userId = useAuthStore((state) => state.session?.user.id)
  const support = pushSupport()
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (support === 'supported') isSubscribedHere().then(setEnabled)
  }, [support])

  const toggle = async () => {
    if (!userId || busy) return
    setBusy(true)
    setMessage(null)
    if (enabled) {
      await disablePush(userId).catch(() => undefined)
      setEnabled(false)
    } else {
      const result = await enablePush(userId)
      setEnabled(result === 'enabled')
      if (result === 'denied') setMessage(t('notifications.denied'))
      if (result === 'error') setMessage(t('notifications.error'))
    }
    setBusy(false)
  }

  return (
    <div className="bg-surface-200 border border-border rounded-md p-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold text-ink flex items-center gap-2">
            <BellRing size={17} className="text-accent" />
            {title ?? t('notifications.settingsTitle')}
          </h2>
          <p className="text-xs text-ink-muted mt-1">{description ?? t('notifications.promptBody')}</p>
        </div>
        {support === 'supported' && (
          <button
            role="switch"
            aria-checked={enabled}
            aria-label={title ?? t('notifications.settingsTitle')}
            onClick={toggle}
            disabled={busy}
            className={`relative w-12 h-7 rounded-full shrink-0 transition-colors disabled:opacity-50 ${enabled ? 'bg-primary' : 'bg-border'}`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${enabled ? 'left-6' : 'left-1'}`}
            />
          </button>
        )}
      </div>
      {support === 'needs-install' && <p className="text-xs text-ink">{t('notifications.needsInstall')}</p>}
      {support === 'unsupported' && <p className="text-xs text-ink-muted">{t('notifications.unsupported')}</p>}
      {support === 'not-configured' && <p className="text-xs text-ink-muted">{t('notifications.notConfigured')}</p>}
      {message && <p className="text-xs text-danger">{message}</p>}
    </div>
  )
}
