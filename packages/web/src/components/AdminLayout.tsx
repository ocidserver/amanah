import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { useThemeStore } from "../stores/theme-store"
import { useNetworkStatus } from "../hooks/use-network-status"
import { IconHome, IconUser, IconLoan, IconShield, IconArrowRightLeft, IconLogOut, IconFileText, IconList } from "./Icons"

const navItems = [
  { to: "/admin", label: "Dashboard", Icon: IconHome, end: true },
  { to: "/admin/users", label: "Pengguna", Icon: IconUser },
  { to: "/admin/documents", label: "Review Dokumen", Icon: IconFileText },
  { to: "/admin/loans", label: "Pinjaman", Icon: IconLoan },
  { to: "/admin/trustees", label: "Wali Amanah", Icon: IconShield },
  { to: "/admin/role-changes", label: "Perubahan Role", Icon: IconArrowRightLeft },
  { to: "/admin/audit-logs", label: "Log Audit", Icon: IconList },
]

export default function AdminLayout() {
  const { signOut, user } = useAuth()
  const { isDark, toggle } = useThemeStore()
  const isOnline = useNetworkStatus()
  const navigate = useNavigate()

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />
  }

  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex">
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 bg-amber-500 text-white text-center text-xs py-1.5 font-medium z-[100]">
          Tidak ada koneksi internet
        </div>
      )}
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-primary)] dark:bg-slate-800 text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10 dark:border-slate-700">
          <h1 className="text-xl font-bold tracking-wide">Amanah</h1>
          <p className="text-xs text-white/60 dark:text-slate-400 mt-0.5">Panel Admin</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/20 dark:bg-slate-700 text-white"
                    : "text-white/70 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-700/50 hover:text-white"
                }`
              }
            >
              <item.Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-white/10 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-white/20 dark:bg-slate-600 flex items-center justify-center text-sm font-bold shrink-0">
              {(user?.displayName?.[0] || user?.email?.[0] || "A").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.displayName || "Admin"}</p>
              <p className="text-xs text-white/60 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-white/10 dark:bg-slate-700 hover:bg-white/20 dark:hover:bg-slate-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            <IconLogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white dark:bg-slate-800 dark:border-slate-700 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Panel Admin</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Manajemen sistem Amanah</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              aria-label={isDark ? "Mode terang" : "Mode gelap"}
            >
              {isDark ? (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
                <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
            <span className="text-sm text-gray-500 dark:text-slate-400">
              {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
