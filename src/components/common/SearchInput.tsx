import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoFocus?: boolean
  /** Background of the field (the modal uses the lighter surface). */
  surface?: 'surface-100' | 'surface-200'
  className?: string
}

/** Search field with a magnifier on the left and a clear (×) button on the right once something is typed. */
export default function SearchInput({
  value,
  onChange,
  placeholder,
  autoFocus = false,
  surface = 'surface-200',
  className = '',
}: SearchInputProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={17} />
      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full pl-10 pr-10 py-2 border border-border rounded-full text-ink focus:ring-2 focus:ring-primary focus:border-transparent ${
          surface === 'surface-100' ? 'bg-surface-100' : 'bg-surface-200'
        }`}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('')
            inputRef.current?.focus()
          }}
          aria-label={t('search.clear')}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-100"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
