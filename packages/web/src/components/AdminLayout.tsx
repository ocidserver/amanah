import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { IconHome, IconUser, IconLoan, IconShield, IconArrowRightLeft, IconLogOut } from "./Icons"

const navItems = [
  { to: "/admin", label: "Dashboard", Icon: IconHome, end: true },
  { to: "/admin/users", label: "Pengguna", Icon: IconUser },
  { to: "/admin/loans", label: "Pinjaman", Icon: IconLoan },
  { to: "/admin/trustees", label: "Wali Amanah", Icon: IconShield },
  { to: "/admin/role-changes", label: "Perubahan Role", Icon: IconArrowRightLeft },
]

export default function AdminLayout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />
  }

  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-primary)] text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-wide">Amanah</h1>
          <p className="text-xs text-white/60 mt-0.5">Panel Admin</p>
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
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">
              {(user?.displayName?.[0] || user?.email?.[0] || "A").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.displayName || "Admin"}</p>
              <p className="text-xs text-white/60 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            <IconLogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Panel Admin</h2>
            <p className="text-sm text-gray-500">Manajemen sistem Amanah</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
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
