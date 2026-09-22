import { useTranslation } from '@/hooks/useTranslation'

export default function LanguageSwitch({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useTranslation()

  return (
    <div className={`inline-flex rounded-full border border-border p-0.5 ${className}`}>
      {(['fr', 'en'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
            language === lang
              ? 'bg-primary text-white'
              : 'text-ink-muted'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
