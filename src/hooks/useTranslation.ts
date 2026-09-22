import { useUiStore } from '@/store/uiStore'
import { translations, type TranslationKey } from '@/i18n/translations'

export function useTranslation() {
  const language = useUiStore((state) => state.language)
  const setLanguage = useUiStore((state) => state.setLanguage)

  const t = (key: TranslationKey, vars?: Record<string, string | number>) => {
    let str: string = translations[language][key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v))
      }
    }
    return str
  }

  return { t, language, setLanguage }
}
