import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronDown,
  CalendarDays,
  Search,
  BookOpen,
  PencilLine,
  Refrigerator,
  ShoppingCart,
  UserRound,
  Lightbulb,
  MessageSquare,
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { HELP, type HelpSectionId } from '@/i18n/help'

const ICONS: Record<HelpSectionId, typeof Search> = {
  week: CalendarDays,
  recipes: Search,
  recipe: BookOpen,
  create: PencilLine,
  fridge: Refrigerator,
  shopping: ShoppingCart,
  profile: UserRound,
  good: Lightbulb,
}

export default function HelpPage() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const content = HELP[language === 'en' ? 'en' : 'fr']
  // One topic open at a time (the first one at start): opening another closes it,
  // so the page never gets long to scroll
  const [open, setOpen] = useState<HelpSectionId | null>('week')
  const sectionRefs = useRef<Partial<Record<HelpSectionId, HTMLElement | null>>>({})

  const toggle = (id: HelpSectionId) => {
    const opening = open !== id
    setOpen(opening ? id : null)
    if (opening) {
      // Closing the topic above moves this one up: bring its title back into view
      window.requestAnimationFrame(() =>
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      )
    }
  }

  return (
    <div className="p-4 pb-8 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-display font-bold text-2xl text-ink">{content.title}</h1>
      </div>

      <p className="text-sm text-ink-muted">{content.intro}</p>

      <div className="space-y-2">
        {content.sections.map(({ id, title, items }) => {
          const Icon = ICONS[id]
          const isOpen = open === id
          return (
            <section
              key={id}
              ref={(el) => (sectionRefs.current[id] = el)}
              className="bg-surface-200 border border-border rounded-md overflow-hidden scroll-mt-2"
            >
              <button
                onClick={() => toggle(id)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 px-3 py-3 text-left"
              >
                <span className="w-9 h-9 rounded-sm bg-tint-sage flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-primary" />
                </span>
                <span className="flex-1 font-display font-semibold text-ink">{title}</span>
                <ChevronDown size={18} className={`text-ink-muted shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <ul className="px-4 pb-3 pl-[3.75rem] space-y-2">
                  {items.map((item) => (
                    <li key={item} className="text-sm text-ink leading-snug list-disc marker:text-primary">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <div className="bg-tint-sand rounded-md p-4 flex items-start gap-3">
        <MessageSquare size={18} className="text-accent shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-display font-semibold text-ink text-sm">{content.contactTitle}</p>
          <p className="text-xs text-ink-muted mt-0.5">{content.contactText}</p>
          <Link to="/profile#contact" className="inline-block mt-2 text-sm font-semibold text-primary">
            {content.contactLink} →
          </Link>
        </div>
      </div>
    </div>
  )
}
