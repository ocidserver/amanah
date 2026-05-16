import { Outlet, NavLink, Navigate } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { useThemeStore } from "../stores/theme-store"
import { useNetworkStatus } from "../hooks/use-network-status"
import { IconHome, IconLoan, IconTrustee, IconUser } from "./Icons"

const navItems = [
  { to: "/dashboard", label: "Beranda", Icon: IconHome },
  { to: "/pinjaman", label: "Pinjaman", Icon: IconLoan },
  { to: "/wali-amanah", label: "Wali", Icon: IconTrustee },
  { to: "/profil", label: "Profil", Icon: IconUser },
]

export default function Layout() {
  const { isBorrower } = useAuth()
  const { isDark, toggle } = useThemeStore()
  const isOnline = useNetworkStatus()

  if (isBorrower) {
    return <Navigate to="/borrower" replace />
  }

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-slate-900 flex flex-col">
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center text-xs py-1.5 font-medium sticky top-0 z-50">
          Tidak ada koneksi internet
        </div>
      )}
      <header className="bg-[var(--color-primary)] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 safe-top">
        <h1 className="text-lg font-bold tracking-wide">Amanah</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={isDark ? "Mode terang" : "Mode gelap"}
          >
            {isDark ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
          <span className="text-xs opacity-70">Qardhul Hasan</span>
        </div>
      </header>

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-800 dark:border-slate-700 border-t border-gray-100 z-40 safe-bottom" role="navigation" aria-label="Navigasi utama">
        <div className="max-w-lg mx-auto grid grid-cols-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
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
                  <item.Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
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
