import { useCallback } from "react"
import { useI18nStore } from "../stores/i18n-store"
import { t as translate, type Language } from "../lib/i18n"

export function useI18n() {
  const language = useI18nStore((s) => s.language)
  const setLanguage = useI18nStore((s) => s.setLanguage)

  const t = useCallback(
    (key: string) => translate(key, language),
    [language]
  )

  return { t, language, setLanguage }
}
