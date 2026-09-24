import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Trash2, ShieldCheck, FileText, ChevronRight, Loader2 } from 'lucide-react'
import { accountService } from '@/services/supabaseClient'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from '@/hooks/useTranslation'
import Modal from '@/components/common/Modal'

/** Profile: legal pages, data export and account deletion (GDPR rights). */
export default function AccountDataSection() {
  const { t } = useTranslation()
  const userId = useAuthStore((state) => state.session?.user.id)
  const logout = useAuthStore((state) => state.logout)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)

  const confirmWord = t('account.deleteWord')
  const canDelete = confirmText.trim().toUpperCase() === confirmWord.toUpperCase()

  const handleExport = async () => {
    if (!userId) return
    setIsExporting(true)
    setExportError(false)
    try {
      const data = await accountService.exportData(userId)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mealsup-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      console.error('Data export error:', err)
      setExportError(true)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async () => {
    if (!userId || !canDelete) return
    setIsDeleting(true)
    setDeleteError(false)
    try {
      await accountService.deleteAccount(userId)
      logout()
    } catch (err) {
      console.error('Account deletion error:', err)
      setDeleteError(true)
      setIsDeleting(false)
    }
  }

  const rowClass = 'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-100'

  return (
    <div className="bg-surface-200 border border-border rounded-md overflow-hidden">
      <h2 className="font-display font-semibold text-ink px-4 pt-4 pb-1">{t('account.title')}</h2>
      <div className="divide-y divide-border">
        <Link to="/legal/privacy" className={rowClass}>
          <ShieldCheck size={18} className="text-primary shrink-0" />
          <span className="flex-1 text-sm text-ink">{t('legal.privacy')}</span>
          <ChevronRight size={16} className="text-ink-muted" />
        </Link>
        <Link to="/legal/notice" className={rowClass}>
          <FileText size={18} className="text-primary shrink-0" />
          <span className="flex-1 text-sm text-ink">{t('legal.notice')}</span>
          <ChevronRight size={16} className="text-ink-muted" />
        </Link>
        <button type="button" onClick={handleExport} disabled={isExporting} className={rowClass}>
          {isExporting ? (
            <Loader2 size={18} className="text-primary shrink-0 animate-spin" />
          ) : (
            <Download size={18} className="text-primary shrink-0" />
          )}
          <span className="flex-1">
            <span className="block text-sm text-ink">{t('account.export')}</span>
            <span className="block text-xs text-ink-muted">
              {exportError ? t('account.exportError') : t('account.exportHint')}
            </span>
          </span>
        </button>
        <button type="button" onClick={() => setShowDelete(true)} className={rowClass}>
          <Trash2 size={18} className="text-danger shrink-0" />
          <span className="flex-1 text-sm text-danger font-semibold">{t('account.delete')}</span>
        </button>
      </div>

      {showDelete && (
        <Modal title={t('account.delete')} onClose={() => !isDeleting && setShowDelete(false)}>
          <div className="space-y-3">
            <p className="text-sm text-ink">{t('account.deleteWarning')}</p>
            <p className="text-sm text-ink">{t('account.deleteExportTip')}</p>
            <label className="block text-sm text-ink">
              {t('account.deleteConfirmLabel', { word: confirmWord })}
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoCapitalize="characters"
                autoComplete="off"
                className="mt-1.5 w-full px-3 py-2 border border-border rounded-sm bg-surface-200 text-ink focus:ring-2 focus:ring-danger focus:border-transparent"
              />
            </label>
            {deleteError && <p className="text-sm text-danger">{t('account.deleteError')}</p>}
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
              className="w-full py-2.5 bg-danger text-white rounded-full font-display font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isDeleting && <Loader2 size={16} className="animate-spin" />}
              {t('account.deleteConfirm')}
            </button>
            <button
              type="button"
              onClick={() => setShowDelete(false)}
              disabled={isDeleting}
              className="w-full py-2.5 border border-border text-ink rounded-full font-display font-semibold"
            >
              {t('common.cancel')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
