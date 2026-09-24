import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** Take most of the screen height (for long, scrollable content). */
  tall?: boolean
}

export default function Modal({ title, onClose, children, tall = false }: ModalProps) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative w-full sm:max-w-[360px] max-h-[85dvh] bg-surface-200 rounded-t-lg sm:rounded-lg flex flex-col ${
          tall ? 'h-[85dvh] sm:h-[70dvh]' : ''
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="font-display font-semibold text-ink">{title}</h2>
          <button onClick={onClose} aria-label={t('common.close')} className="p-1 text-ink-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  )
}
