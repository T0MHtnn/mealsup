import { useState } from 'react'
import { Info } from 'lucide-react'
import Modal from '@/components/common/Modal'

interface InfoButtonProps {
  /** Title of the explanation window, also used as the button's label. */
  title: string
  paragraphs: string[]
  size?: number
}

/** Small ⓘ next to an estimated value: the explanation opens on demand instead of cluttering every card. */
export default function InfoButton({ title, paragraphs, size = 15 }: InfoButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        aria-label={title}
        className="inline-flex items-center justify-center w-6 h-6 -m-1 rounded-full text-ink-muted hover:text-ink align-middle shrink-0"
      >
        <Info size={size} />
      </button>
      {open && (
        <Modal title={title} onClose={() => setOpen(false)}>
          <div className="space-y-2">
            {paragraphs.map((p) => (
              <p key={p} className="text-sm text-ink leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </Modal>
      )}
    </>
  )
}
