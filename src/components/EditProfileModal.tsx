import { useRef, useState } from 'react'
import { User as UserIcon, Camera } from 'lucide-react'
import { supabase, userService, storageService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import Modal from '@/components/common/Modal'

interface EditProfileModalProps {
  userId: string
  email: string
  username: string
  avatarUrl: string | null
  canEditAuth: boolean
  onClose: () => void
  onSaved: (fields: { username: string; avatarUrl: string | null; email: string }) => void
}

export default function EditProfileModal({
  userId,
  email: initialEmail,
  username: initialUsername,
  avatarUrl: initialAvatarUrl,
  canEditAuth,
  onClose,
  onSaved,
}: EditProfileModalProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [username, setUsername] = useState(initialUsername)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      let avatarUrl = initialAvatarUrl
      if (avatarFile) {
        avatarUrl = await storageService.uploadAvatar(userId, avatarFile)
      }

      await userService.updatePreferences(userId, { username, avatar_url: avatarUrl })

      if (canEditAuth) {
        const authUpdates: { email?: string; password?: string } = {}
        if (email && email !== initialEmail) authUpdates.email = email
        if (password) authUpdates.password = password
        if (Object.keys(authUpdates).length > 0) {
          const { error: authError } = await supabase.auth.updateUser(authUpdates)
          if (authError) throw authError
        }
      }

      onSaved({ username, avatarUrl, email })
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal title={t('profile.edit')} onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-full bg-tint-sage flex items-center justify-center overflow-hidden"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="text-primary" size={32} />
            )}
            <span className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="text-white" size={20} />
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-primary font-semibold"
          >
            {t('profile.changePhoto')}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-tint-clay border border-danger rounded-sm text-danger text-xs">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('profile.username')}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-sm bg-surface-100 text-ink text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('auth.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!canEditAuth}
            className="w-full px-3 py-2 border border-border rounded-sm bg-surface-100 text-ink text-sm disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('profile.newPassword')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!canEditAuth}
            placeholder={t('profile.newPasswordPlaceholder')}
            className="w-full px-3 py-2 border border-border rounded-sm bg-surface-100 text-ink text-sm disabled:opacity-50"
            minLength={6}
          />
        </div>

        {!canEditAuth && <p className="text-xs text-ink-muted">{t('profile.googleLocked')}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-2.5 bg-primary text-white rounded-full font-display font-semibold disabled:opacity-50"
        >
          {isSaving ? t('profile.saving') : t('profile.saveChanges')}
        </button>
      </form>
    </Modal>
  )
}
