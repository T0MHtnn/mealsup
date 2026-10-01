import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

interface ImageViewerProps {
  src: string
  alt: string
  onClose: () => void
}

const MIN_SCALE = 1
const MAX_SCALE = 5
const DOUBLE_TAP_SCALE = 2.5
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Full-screen photo: pinch or double-tap to zoom, drag to move around, wheel on a computer. */
export default function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  const { t } = useTranslation()
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ distance: number; scale: number; x: number; y: number; midX: number; midY: number } | null>(null)
  const lastTap = useRef(0)
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /** Keeps the photo from being dragged out of the screen. */
  const fit = (scale: number, x: number, y: number) => {
    const rect = stage.current?.getBoundingClientRect()
    const maxX = rect ? (rect.width * (scale - 1)) / 2 : 0
    const maxY = rect ? (rect.height * (scale - 1)) / 2 : 0
    return { scale, x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) }
  }

  /** Zoom keeping the point under the finger / cursor in place. */
  const zoomAt = (nextScale: number, clientX: number, clientY: number, from = view) => {
    const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE)
    const rect = stage.current?.getBoundingClientRect()
    if (!rect) return fit(scale, 0, 0)
    const px = clientX - rect.left - rect.width / 2
    const py = clientY - rect.top - rect.height / 2
    const ratio = scale / from.scale
    return fit(scale, px - (px - from.x) * ratio, py - (py - from.y) * ratio)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        scale: view.scale,
        x: view.x,
        y: view.y,
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
      }
    } else if (pointers.current.size === 1) {
      const now = Date.now()
      if (now - lastTap.current < 300) {
        setView(view.scale > 1 ? { scale: 1, x: 0, y: 0 } : zoomAt(DOUBLE_TAP_SCALE, e.clientX, e.clientY))
        lastTap.current = 0
      } else {
        lastTap.current = now
      }
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const previous = pointers.current.get(e.pointerId)
    if (!previous) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()]
      const start = gesture.current
      const scale = start.scale * (Math.hypot(a.x - b.x, a.y - b.y) / start.distance)
      const moved = zoomAt(scale, start.midX, start.midY, { scale: start.scale, x: start.x, y: start.y })
      setView(fit(moved.scale, moved.x + (a.x + b.x) / 2 - start.midX, moved.y + (a.y + b.y) / 2 - start.midY))
    } else if (pointers.current.size === 1 && view.scale > 1) {
      setView((v) => fit(v.scale, v.x + e.clientX - previous.x, v.y + e.clientY - previous.y))
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) gesture.current = null
    if (view.scale < 1.05) setView({ scale: 1, x: 0, y: 0 })
  }

  const onWheel = (e: React.WheelEvent) => {
    setView(zoomAt(view.scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY))
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col" role="dialog" aria-modal="true" aria-label={alt}>
      <div className="flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 shrink-0">
        <p className="text-xs text-white/70 pr-3">{t('recipes.photoZoomHint')}</p>
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          className="w-10 h-10 shrink-0 rounded-full bg-white/15 text-white flex items-center justify-center"
        >
          <X size={22} />
        </button>
      </div>
      <div
        ref={stage}
        className="relative flex-1 overflow-hidden touch-none select-none mb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transition: pointers.current.size ? 'none' : 'transform 150ms ease-out',
          }}
        />
      </div>
    </div>
  )
}
