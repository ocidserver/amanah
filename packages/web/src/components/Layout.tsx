import { Outlet, NavLink, Navigate } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { IconHome, IconLoan, IconTrustee, IconUser, IconSettings } from "./Icons"

const navItems = [
  { to: "/dashboard", label: "Beranda", Icon: IconHome },
  { to: "/pinjaman", label: "Pinjaman", Icon: IconLoan },
  { to: "/wali-amanah", label: "Wali", Icon: IconTrustee },
  { to: "/profil", label: "Profil", Icon: IconUser },
]

export default function Layout() {
  const { isBorrower } = useAuth()

  if (isBorrower) {
    return <Navigate to="/borrower" replace />
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      <header className="bg-[var(--color-primary)] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 safe-top">
        <h1 className="text-lg font-bold tracking-wide">Amanah</h1>
        <span className="text-xs opacity-70">Qardhul Hasan</span>
      </header>

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-40 safe-bottom" role="navigation" aria-label="Navigasi utama">
        <div className="max-w-lg mx-auto grid grid-cols-5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 pt-2.5 text-[10px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-gray-400 hover:text-gray-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.Icon className={`w-[22px] h-[22px] mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
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