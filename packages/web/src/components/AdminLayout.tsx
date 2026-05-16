import { useState, useEffect, useRef } from "react"
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { useThemeStore } from "../stores/theme-store"
import { useNetworkStatus } from "../hooks/use-network-status"
import { useI18n } from "../hooks/use-i18n"
import { IconHome, IconUser, IconLoan, IconShield, IconArrowRightLeft, IconLogOut, IconFileText, IconList, IconSun, IconMoon, IconChevronDown, IconShield as IconShield2 } from "./Icons"

export default function AdminLayout() {
  const { signOut, user } = useAuth()
  const { isDark, toggle } = useThemeStore()
  const isOnline = useNetworkStatus()
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showMenu])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowMenu(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />
  }

  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  const navItems = [
    { to: "/admin", label: t("nav.home"), Icon: IconHome, end: true },
    { to: "/admin/users", label: t("admin.users"), Icon: IconUser },
    { to: "/admin/documents", label: t("admin.documents"), Icon: IconFileText },
    { to: "/admin/loans", label: t("admin.loans"), Icon: IconLoan },
    { to: "/admin/trustees", label: t("admin.trustees"), Icon: IconShield },
    { to: "/admin/role-changes", label: t("admin.roleChanges"), Icon: IconArrowRightLeft },
    { to: "/admin/audit-logs", label: t("admin.auditLogs"), Icon: IconList },
    { to: "/admin/2fa", label: t("admin.twoFactor"), Icon: IconShield2 },
  ]

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 flex overflow-hidden">
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 bg-amber-500 text-white text-center text-xs py-1.5 font-medium z-[100]" role="alert">
          {t("common.noInternet")}
        </div>
      )}
      <aside className="w-64 bg-[var(--color-primary)] dark:bg-slate-800 text-white flex flex-col shrink-0" role="complementary" aria-label={t("admin.panel")}>
        <div className="px-6 py-5 border-b border-white/10 dark:border-slate-700">
          <h1 className="text-xl font-bold tracking-wide">{t("app.name")}</h1>
          <p className="text-xs text-white/60 dark:text-slate-400 mt-0.5">{t("admin.panel")}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label={t("admin.panel")}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                  isActive
                    ? "bg-white/20 dark:bg-slate-700 text-white"
                    : "text-white/70 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-700/50 hover:text-white"
                }`
              }
            >
              <item.Icon className="w-5 h-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white dark:bg-slate-800 dark:border-slate-700 border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("admin.panel")}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">{t("admin.systemSummary")}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              aria-label={isDark ? t("profile.indonesian") : t("profile.english")}
            >
              {isDark ? <IconSun className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <IconMoon className="w-5 h-5 text-gray-600" />}
            </button>
            <span className="text-sm text-gray-500 dark:text-slate-400 hidden lg:inline">
              {new Date().toLocaleDateString(language === "id" ? "id-ID" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                aria-expanded={showMenu}
                aria-haspopup="true"
                aria-label={t("profile.accountSettings")}
              >
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold shrink-0" aria-hidden="true">
                  {(user?.displayName?.[0] || user?.email?.[0] || "A").toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden lg:inline max-w-32 truncate">
                  {user?.displayName || user?.email || "Admin"}
                </span>
                <IconChevronDown className={`w-4 h-4 text-gray-400 hidden lg:inline transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} aria-hidden="true" />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden" role="menu">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.displayName || "Admin"}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium focus:outline-none focus-visible:bg-red-50 dark:focus-visible:bg-red-900/20"
                      role="menuitem"
                    >
                      <IconLogOut className="w-4 h-4" aria-hidden="true" />
                      {t("auth.logout")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
