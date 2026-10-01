import { useEffect, useMemo, useState } from 'react'
import { Check, RotateCcw, Trash2 } from 'lucide-react'
import { adminService, type Feedback } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { useAdminStore } from '@/store/adminStore'
import { normalizeText } from '@/utils/text'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SearchInput from '@/components/common/SearchInput'

type StatusFilter = 'open' | 'resolved' | 'all'

export default function AdminFeedbacksPage() {
  const { t, language } = useTranslation()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusFilter>('open')
  const [search, setSearch] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    adminService
      .listFeedback()
      .then(setFeedbacks)
      .catch((err) => {
        console.error('Feedback load error:', err)
        setError(t('admin.loadError'))
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(
    () => ({
      open: feedbacks.filter((f) => !f.resolved).length,
      resolved: feedbacks.filter((f) => f.resolved).length,
      all: feedbacks.length,
    }),
    [feedbacks]
  )

  // Keep the badge of the tab in step with what is shown here
  const setOpenFeedbacks = useAdminStore((state) => state.setOpenFeedbacks)
  useEffect(() => {
    if (!isLoading && !error) setOpenFeedbacks(counts.open)
  }, [isLoading, error, counts.open, setOpenFeedbacks])

  const filtered = useMemo(() => {
    const query = normalizeText(search.trim())
    return feedbacks.filter((f) => {
      if (status === 'open' && f.resolved) return false
      if (status === 'resolved' && !f.resolved) return false
      return !query || normalizeText(`${f.message} ${f.email ?? ''}`).includes(query)
    })
  }, [feedbacks, status, search])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const toggleResolved = async (feedback: Feedback) => {
    const resolved = !feedback.resolved
    setFeedbacks((prev) => prev.map((f) => (f.id === feedback.id ? { ...f, resolved } : f)))
    try {
      await adminService.setFeedbackResolved(feedback.id, resolved)
    } catch (err) {
      console.error('Update feedback error:', err)
      setFeedbacks((prev) => prev.map((f) => (f.id === feedback.id ? { ...f, resolved: !resolved } : f)))
      setError(t('admin.actionError'))
    }
  }

  const remove = async (feedback: Feedback) => {
    if (confirmDeleteId !== feedback.id) {
      setConfirmDeleteId(feedback.id)
      return
    }
    setConfirmDeleteId(null)
    try {
      await adminService.deleteFeedback(feedback.id)
      setFeedbacks((prev) => prev.filter((f) => f.id !== feedback.id))
    } catch (err) {
      console.error('Delete feedback error:', err)
      setError(t('admin.actionError'))
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-4 space-y-3">
      <h1 className="font-display font-bold text-xl text-ink">{t('admin.feedbacks.title')}</h1>

      <SearchInput value={search} onChange={setSearch} placeholder={t('admin.feedbacks.search')} />

      <div className="flex gap-1.5">
        {(['open', 'resolved', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
              status === s ? 'bg-ink text-surface-100 border-ink' : 'bg-surface-200 text-ink-muted border-border'
            }`}
          >
            {t(`admin.feedbacks.filter.${s}`)} ({counts[s]})
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {filtered.length === 0 ? (
        <p className="text-center text-ink-muted text-sm py-8">{t('admin.feedbacks.none')}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => (
            <div
              key={f.id}
              className={`bg-surface-200 border rounded-md p-3 space-y-2 ${f.resolved ? 'border-border opacity-70' : 'border-accent'}`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] text-ink-muted">
                <span className="truncate">{f.email || t('admin.feedbacks.unknownSender')}</span>
                <span className="shrink-0">{formatDate(f.created_at)}</span>
              </div>
              <p className="text-sm text-ink whitespace-pre-wrap break-words">{f.message}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleResolved(f)}
                  className="flex-1 py-1.5 rounded-full border border-border text-sm text-ink flex items-center justify-center gap-1.5"
                >
                  {f.resolved ? <RotateCcw size={14} /> : <Check size={14} />}
                  {f.resolved ? t('admin.feedbacks.reopen') : t('admin.feedbacks.markResolved')}
                </button>
                <button
                  onClick={() => remove(f)}
                  onBlur={() => setConfirmDeleteId(null)}
                  className={`flex-1 py-1.5 rounded-full border text-sm flex items-center justify-center gap-1.5 ${
                    confirmDeleteId === f.id ? 'bg-danger text-white border-danger' : 'border-border text-danger'
                  }`}
                >
                  <Trash2 size={14} />
                  {confirmDeleteId === f.id ? t('admin.feedbacks.confirmDelete') : t('admin.feedbacks.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
