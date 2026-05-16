import { Outlet, NavLink, Navigate } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { useThemeStore } from "../stores/theme-store"
import { useNetworkStatus } from "../hooks/use-network-status"
import { useI18n } from "../hooks/use-i18n"
import { IconShield, IconUser, IconSettings, IconSun, IconMoon } from "./Icons"

export default function TrusteeLayout() {
  const { isBorrower } = useAuth()
  const { isDark, toggle } = useThemeStore()
  const isOnline = useNetworkStatus()
  const { t, language } = useI18n()

  if (isBorrower) {
    return <Navigate to="/borrower" replace />
  }

  const navItems = [
    { to: "/trustee", label: t("nav.home"), Icon: IconShield },
    { to: "/trustee/profil", label: t("nav.profile"), Icon: IconUser },
    { to: "/trustee/pengaturan", label: t("nav.settings"), Icon: IconSettings },
  ]

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-slate-900 flex flex-col">
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center text-xs py-1.5 font-medium sticky top-0 z-50" role="alert">
          {t("common.noInternet")}
        </div>
      )}
      <header className="bg-[var(--color-primary)] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 safe-top">
        <h1 className="text-lg font-bold tracking-wide">{t("app.name")}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label={isDark ? t("profile.indonesian") : t("profile.english")}
          >
            {isDark ? <IconSun className="w-5 h-5" aria-hidden="true" /> : <IconMoon className="w-5 h-5" aria-hidden="true" />}
          </button>
          <span className="text-xs opacity-70">{t("role.trustee")}</span>
        </div>
      </header>

      <main className="flex-1 pb-20" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-800 dark:border-slate-700 border-t border-gray-100 z-40 safe-bottom" role="navigation" aria-label={t("nav.home")}>
        <div className="max-w-lg mx-auto grid grid-cols-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/trustee"}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 text-[10px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} aria-hidden="true" />
                  <span className={isActive ? "font-semibold" : "font-normal"}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
