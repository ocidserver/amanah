import { Outlet, NavLink, Navigate } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { useThemeStore } from "../stores/theme-store"
import { useNetworkStatus } from "../hooks/use-network-status"
import { IconWallet, IconUser, IconSun, IconMoon } from "./Icons"

const navItems = [
  { to: "/borrower", label: "Pinjaman", Icon: IconWallet },
  { to: "/borrower/profil", label: "Profil", Icon: IconUser },
]

export default function BorrowerLayout() {
  const { isLender } = useAuth()
  const { isDark, toggle } = useThemeStore()
  const isOnline = useNetworkStatus()

  if (isLender) {
    return <Navigate to="/dashboard" replace />
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
            {isDark ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
          </button>
          <span className="text-xs opacity-70">Peminjam</span>
        </div>
      </header>

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-800 dark:border-slate-700 border-t border-gray-100 z-40 safe-bottom" role="navigation" aria-label="Navigasi peminjam">
        <div className="max-w-lg mx-auto grid grid-cols-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/borrower"}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 text-[10px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-gray-400 hover:text-gray-600"
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
