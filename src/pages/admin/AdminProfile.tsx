import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Pencil, ShieldCheck, User as UserIcon, ArrowLeftRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { authService, userService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import EditProfileModal from '@/components/EditProfileModal'

export default function AdminProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const session = useAuthStore((state) => state.session)
  const logout = useAuthStore((state) => state.logout)
  const setAdminMode = useUiStore((state) => state.setAdminMode)
  const userId = session?.user.id
  const canEditAuth = session?.user.app_metadata?.provider === 'email'

  const [email, setEmail] = useState(session?.user.email || '')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (!userId) return
    userService
      .getUserPreferences(userId)
      .then((data) => {
        setUsername(data?.username || '')
        setAvatarUrl(data?.avatar_url || null)
      })
      .catch((err) => console.error('Admin profile load error:', err))
  }, [userId])

  const backToApp = () => {
    setAdminMode(false)
    navigate('/', { replace: true })
  }

  const handleLogout = async () => {
    await authService.signOut()
    setAdminMode(false)
    logout()
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-surface-200 border border-border rounded-md p-4 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-tint-sage flex items-center justify-center overflow-hidden shrink-0">
          {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <UserIcon className="text-primary" size={24} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-ink truncate">{username || email}</p>
          <p className="text-xs text-ink-muted truncate">{email}</p>
          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-accent px-2 py-0.5 rounded-full">
            <ShieldCheck size={11} />
            {t('admin.role.admin')}
          </span>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          aria-label={t('admin.profile.edit')}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink shrink-0"
        >
          <Pencil size={16} />
        </button>
      </div>

      <button
        onClick={backToApp}
        className="w-full py-2.5 bg-primary text-white rounded-full font-display font-semibold hover:bg-primary-strong flex items-center justify-center gap-2"
      >
        <ArrowLeftRight size={18} />
        {t('admin.profile.backToApp')}
      </button>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-danger text-danger rounded-full font-display font-semibold hover:bg-tint-clay"
      >
        <LogOut size={18} />
        {t('profile.logout')}
      </button>

      {showEditModal && userId && (
        <EditProfileModal
          userId={userId}
          email={email}
          username={username}
          avatarUrl={avatarUrl}
          canEditAuth={canEditAuth}
          onClose={() => setShowEditModal(false)}
          onSaved={(fields) => {
            setUsername(fields.username)
            setAvatarUrl(fields.avatarUrl)
            setEmail(fields.email)
            setShowEditModal(false)
          }}
        />
      )}
    </div>
  )
}
