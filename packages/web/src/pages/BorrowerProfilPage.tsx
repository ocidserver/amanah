import { useAuth } from "../hooks/use-auth"
import { useNavigate, Link } from "react-router-dom"
import { IconLogOut, IconChevronRight } from "../components/Icons"
import { BORROWER_TIER_LABELS } from "@amanah/shared"
import type { BorrowerTier } from "@amanah/shared"

export default function BorrowerProfilPage() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  const initial = (user?.displayName?.[0] || user?.email?.[0] || "A").toUpperCase()
  const tierLabel = user?.borrowerTier ? BORROWER_TIER_LABELS[user.borrowerTier as BorrowerTier] : "Peminjam Baru"

  return (
    <div className="px-4 pt-4 pb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Profil</h2>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-lg truncate">{user?.displayName || "Tanpa Nama"}</p>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            <span className="inline-block mt-1 text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full font-medium">
              {tierLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
        <Link
          to="/borrower/pengaturan"
          className="flex items-center gap-3 px-4 py-3.5 text-gray-900 active:bg-gray-50"
        >
          <span className="text-gray-400 text-sm">⚙️</span>
          <span className="flex-1 font-medium text-[15px]">Pengaturan</span>
          <IconChevronRight className="w-4 h-4 text-gray-300" />
        </Link>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 rounded-2xl py-3.5 font-medium active:scale-[0.98] transition-transform"
      >
        <IconLogOut className="w-4 h-4" />
        Keluar
      </button>
    </div>
  )
}