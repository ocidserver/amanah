import { create } from "zustand"

function getInitialDark(): boolean {
  if (typeof window === "undefined") return false
  const stored = localStorage.getItem("theme")
  if (stored === "dark" || stored === "light") return stored === "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function applyDark(dark: boolean) {
  if (typeof window === "undefined") return
  localStorage.setItem("theme", dark ? "dark" : "light")
  document.documentElement.classList.toggle("dark", dark)
}

interface ThemeState {
  isDark: boolean
  toggle: () => void
  setDark: (dark: boolean) => void
}

const initial = getInitialDark()
applyDark(initial)

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: initial,
  toggle: () => {
    const next = !get().isDark
    applyDark(next)
    set({ isDark: next })
  },
  setDark: (dark) => {
    applyDark(dark)
    set({ isDark: dark })
  },
}))
