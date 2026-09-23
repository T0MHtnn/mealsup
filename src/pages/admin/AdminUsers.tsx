import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, ShieldOff, Trash2, User as UserIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { adminService, type AdminUser } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { normalizeText } from '@/utils/text'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SearchInput from '@/components/common/SearchInput'

type RoleFilter = 'all' | 'admin' | 'member'

export default function AdminUsersPage() {
  const { t, language } = useTranslation()
  const myId = useAuthStore((state) => state.session?.user.id)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    adminService
      .listUsers()
      .then(setUsers)
      .catch((err) => {
        console.error('Admin users load error:', err)
        setError(t('admin.loadError'))
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const query = normalizeText(search.trim())
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (!query) return true
      return normalizeText(`${u.email} ${u.username ?? ''}`).includes(query)
    })
  }, [users, search, roleFilter])

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  const toggleRole = async (user: AdminUser) => {
    const role = user.role === 'admin' ? 'member' : 'admin'
    setBusyId(user.id)
    setError(null)
    try {
      await adminService.setRole(user.id, role)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)))
    } catch (err) {
      console.error('Set role error:', err)
      setError(t('admin.actionError'))
    } finally {
      setBusyId(null)
    }
  }

  const deleteUser = async (user: AdminUser) => {
    if (confirmDeleteId !== user.id) {
      setConfirmDeleteId(user.id)
      return
    }
    setBusyId(user.id)
    setError(null)
    try {
      await adminService.deleteUser(user.id)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    } catch (err) {
      console.error('Delete user error:', err)
      setError(t('admin.actionError'))
    } finally {
      setBusyId(null)
      setConfirmDeleteId(null)
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display font-bold text-xl text-ink">{t('admin.users.title')}</h1>
        <span className="text-xs text-ink-muted">{t('admin.users.count', { n: users.length })}</span>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder={t('admin.users.search')} />

      <div className="flex gap-1.5">
        {(['all', 'admin', 'member'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setRoleFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
              roleFilter === f ? 'bg-ink text-surface-100 border-ink' : 'bg-surface-200 text-ink-muted border-border'
            }`}
          >
            {t(`admin.users.filter.${f}`)}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {filtered.length === 0 ? (
        <p className="text-center text-ink-muted text-sm py-8">{t('admin.users.none')}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => {
            const isMe = user.id === myId
            const busy = busyId === user.id
            return (
              <div key={user.id} className="bg-surface-200 border border-border rounded-md p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-tint-sage flex items-center justify-center overflow-hidden shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={18} className="text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-ink truncate flex items-center gap-1.5">
                      <span className="truncate">{user.username || user.email.split('@')[0]}</span>
                      {isMe && <span className="text-[10px] text-ink-muted font-normal">({t('admin.users.you')})</span>}
                    </p>
                    <p className="text-xs text-ink-muted truncate">{user.email}</p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      user.role === 'admin' ? 'bg-accent text-white' : 'bg-tint-sage text-primary'
                    }`}
                  >
                    {t(`admin.role.${user.role}`)}
                  </span>
                </div>

                <p className="text-[11px] text-ink-muted">
                  {t('admin.users.joined')} {formatDate(user.created_at)} · {t('admin.users.lastSeen')} {formatDate(user.last_sign_in_at)}
                </p>

                {!isMe && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleRole(user)}
                      disabled={busy}
                      className="flex-1 py-1.5 rounded-full border border-border text-sm text-ink flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {user.role === 'admin' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                      {user.role === 'admin' ? t('admin.users.removeAdmin') : t('admin.users.makeAdmin')}
                    </button>
                    <button
                      onClick={() => deleteUser(user)}
                      onBlur={() => setConfirmDeleteId(null)}
                      disabled={busy}
                      className={`flex-1 py-1.5 rounded-full border text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                        confirmDeleteId === user.id ? 'bg-danger text-white border-danger' : 'border-border text-danger'
                      }`}
                    >
                      <Trash2 size={14} />
                      {confirmDeleteId === user.id ? t('admin.users.confirmDelete') : t('admin.users.delete')}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
