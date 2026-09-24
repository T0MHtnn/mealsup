import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { LEGAL, type LegalDoc } from '@/i18n/legal'

const DOCS: LegalDoc[] = ['privacy', 'notice']

/** Privacy policy / legal notice. Readable signed in or not (linked from the sign-up page). */
export default function LegalPage() {
  const { doc } = useParams()
  const { t, language } = useTranslation()
  const navigate = useNavigate()

  if (!DOCS.includes(doc as LegalDoc)) return <Navigate to="/legal/privacy" replace />
  const all = LEGAL[language === 'en' ? 'en' : 'fr']
  const content = all[doc as LegalDoc]

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/', { replace: true }))

  return (
    <div className="min-h-[100dvh] bg-surface-100">
      <div className="max-w-[640px] mx-auto p-4 pb-10 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            aria-label={t('common.back')}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-2xl text-ink">{content.title}</h1>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-surface-200 border border-border rounded-full p-1">
          {DOCS.map((d) => (
            <Link
              key={d}
              to={`/legal/${d}`}
              replace
              className={`text-center text-sm font-display font-semibold py-1.5 rounded-full ${
                d === doc ? 'bg-primary text-white' : 'text-ink-muted'
              }`}
            >
              {all[d].title}
            </Link>
          ))}
        </div>

        <p className="text-xs text-ink-muted">{content.updated}</p>
        <p className="text-sm text-ink">{content.intro}</p>

        {content.sections.map((section) => (
          <section key={section.title} className="space-y-1.5">
            <h2 className="font-display font-semibold text-ink">{section.title}</h2>
            {section.paragraphs.map((p) => (
              <p key={p} className="text-sm text-ink leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
