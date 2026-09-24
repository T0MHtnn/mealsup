import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import LanguageSwitch from '@/components/common/LanguageSwitch'
import Logo from '@/components/common/Logo'
import GoogleIcon from '@/components/common/GoogleIcon'
import ResendConfirmation from '@/components/ResendConfirmation'
import { authErrorKey } from '@/utils/authErrors'

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [notConfirmed, setNotConfirmed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotConfirmed(false)
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/')
    } catch (err: any) {
      const key = authErrorKey(err)
      setNotConfirmed(key === 'auth.error.emailNotConfirmed')
      setError(t(key))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          // Always show Google's account chooser instead of silently reusing the last account
          queryParams: { prompt: 'select_account' },
        },
      })
      if (error) throw error
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
          <p className="text-ink-muted mt-2">{t('auth.tagline')}</p>
        </div>

        {error && (
          <div className="p-4 bg-tint-clay border border-danger rounded-sm text-danger text-sm space-y-2">
            <p>{error}</p>
            {notConfirmed && <ResendConfirmation email={email} />}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-primary text-white rounded-full font-display font-semibold hover:bg-primary-strong disabled:opacity-50"
          >
            {isLoading ? t('auth.loading') : t('auth.signIn')}
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-2.5 border border-border rounded-full font-display font-semibold text-ink hover:bg-surface-100 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <GoogleIcon />
          {t('auth.continueGoogle')}
        </button>

        <div className="text-center text-sm text-ink-muted">
          {t('auth.noAccount')}{' '}
          <Link to="/signup" className="text-primary hover:text-primary-strong font-semibold">
            {t('auth.signUpLink')}
          </Link>
        </div>

        <p className="text-center text-xs text-ink-muted">
          <Link to="/legal/privacy" className="hover:text-ink underline-offset-2 hover:underline">{t('legal.privacy')}</Link>
          {' · '}
          <Link to="/legal/notice" className="hover:text-ink underline-offset-2 hover:underline">{t('legal.notice')}</Link>
        </p>
      </div>
    </div>
  )
}
