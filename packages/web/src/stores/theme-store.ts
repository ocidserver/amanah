import { create } from "zustand"

interface ThemeState {
  isDark: boolean
  toggle: () => void
  setDark: (dark: boolean) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: typeof window !== "undefined" && localStorage.getItem("theme") === "dark",
  toggle: () =>
    set((state) => {
      const next = !state.isDark
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", next ? "dark" : "light")
        document.documentElement.classList.toggle("dark", next)
      }
      return { isDark: next }
    }),
  setDark: (dark) =>
    set(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", dark ? "dark" : "light")
        document.documentElement.classList.toggle("dark", dark)
      }
      return { isDark: dark }
    }),
}))
