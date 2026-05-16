import { Outlet, NavLink, Navigate } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { useNetworkStatus } from "../hooks/use-network-status"
import { IconShield, IconUser, IconSettings } from "./Icons"

const navItems = [
  { to: "/trustee", label: "Dashboard", Icon: IconShield },
  { to: "/trustee/profil", label: "Profil", Icon: IconUser },
  { to: "/trustee/pengaturan", label: "Pengaturan", Icon: IconSettings },
]

export default function TrusteeLayout() {
  const { isBorrower } = useAuth()
  const isOnline = useNetworkStatus()

  if (isBorrower) {
    return <Navigate to="/borrower" replace />
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center text-xs py-1.5 font-medium sticky top-0 z-50">
          Tidak ada koneksi internet
        </div>
      )}
      <header className="bg-[var(--color-primary)] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 safe-top">
        <h1 className="text-lg font-bold tracking-wide">Amanah</h1>
        <span className="text-xs opacity-70">Wali Amanah</span>
      </header>

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-40 safe-bottom" role="navigation" aria-label="Navigasi wali amanah">
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
