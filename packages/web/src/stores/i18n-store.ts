import { create } from "zustand"
import type { Language } from "../lib/i18n"

interface I18nState {
  language: Language
  setLanguage: (lang: Language) => void
}

export const useI18nStore = create<I18nState>((set) => ({
  language: (localStorage.getItem("language") as Language) || "id",
  setLanguage: (lang: Language) => {
    localStorage.setItem("language", lang)
    set({ language: lang })
  },
}))
