import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import LanguageSwitch from '@/components/common/LanguageSwitch'
import Logo from '@/components/common/Logo'
import ResendConfirmation from '@/components/ResendConfirmation'
import { authErrorKey } from '@/utils/authErrors'
import { MailCheck } from 'lucide-react'

export default function SignupPage() {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setIsLoading(true)
    try {
      await authService.signUp(email, password, username)
      setSuccess(true)
    } catch (err: any) {
      setError(t(authErrorKey(err)))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-100 p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-surface-200 rounded-lg border border-border">
        <div className="flex justify-end">
          <LanguageSwitch />
        </div>

        <div className="text-center">
          <Logo className="mx-auto" size={44} />
          <p className="text-ink-muted mt-2">{t('auth.createAccount')}</p>
        </div>

        {success ? (
          <div className="p-4 bg-tint-sage border border-primary rounded-sm text-center space-y-3">
            <MailCheck size={32} className="mx-auto text-primary" />
            <p className="font-display font-semibold text-ink">{t('auth.checkEmailTitle')}</p>
            <p className="text-sm text-ink">{t('auth.checkEmailText', { email })}</p>
            <p className="text-xs text-ink-muted">{t('auth.checkEmailHint')}</p>
            <ResendConfirmation email={email} />
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 bg-tint-clay border border-danger rounded-sm text-danger text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink">{t('auth.username')}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-sm bg-surface-200 text-ink focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink">{t('auth.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-sm bg-surface-200 text-ink focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="test@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink">{t('auth.password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-sm bg-surface-200 text-ink focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink">{t('auth.confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-sm bg-surface-200 text-ink focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <p className="text-xs text-ink-muted">
                {t('legal.signupConsent')}{' '}
                <Link to="/legal/privacy" className="text-primary font-semibold">{t('legal.privacyLink')}</Link>.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-primary text-white rounded-full font-display font-semibold hover:bg-primary-strong disabled:opacity-50"
              >
                {isLoading ? t('auth.loading') : t('auth.signUp')}
              </button>
            </form>
          </>
        )}

        <div className="text-center text-sm text-ink-muted">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-primary hover:text-primary-strong font-semibold">
            {t('auth.signInLink')}
          </Link>
        </div>
      </div>
    </div>
  )
}
