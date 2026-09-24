import { useUiStore } from '@/store/uiStore'
import { translations, type TranslationKey } from '@/i18n/translations'

// "{n|article|articles}" : singular or plural form chosen from the variable n
const PLURAL = /\{(\w+)\|([^|}]*)\|([^}]*)\}/g

export function useTranslation() {
  const language = useUiStore((state) => state.language)
  const setLanguage = useUiStore((state) => state.setLanguage)

  // French uses the singular for 0 and 1 ("0 article"), English only for 1
  const isSingular = (n: number) => (language === 'fr' ? Math.abs(n) < 2 : n === 1)

  const t = (key: TranslationKey, vars?: Record<string, string | number>) => {
    let str: string = translations[language][key] ?? key
    if (vars) {
      str = str.replace(PLURAL, (match, name: string, one: string, other: string) =>
        name in vars ? (isSingular(Number(vars[name])) ? one : other) : match
      )
      for (const [k, v] of Object.entries(vars)) {
        // every occurrence ({n} can appear several times in a sentence)
        str = str.split(`{${k}}`).join(String(v))
      }
    }
    return str
  }

  return { t, language, setLanguage }
}
