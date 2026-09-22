import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import type { FoodFlag } from '@/utils/warnings'

interface FoodWarningBadgeProps {
  flag: FoodFlag
  /** Show the label next to the icon (otherwise icon only, label as tooltip). */
  withLabel?: boolean
}

/** Small red warning shown next to a food that matches an excluded food or a dietary restriction. */
export default function FoodWarningBadge({ flag, withLabel = false }: FoodWarningBadgeProps) {
  const { t } = useTranslation()
  if (!flag) return null
  const label = flag === 'excluded' ? t('warning.excludedFood') : t('warning.restriction')

  return (
    <span title={label} aria-label={label} className="inline-flex items-center gap-1 text-danger text-[11px] font-semibold shrink-0">
      <AlertTriangle size={13} />
      {withLabel && label}
    </span>
  )
}
