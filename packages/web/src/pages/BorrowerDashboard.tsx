import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { BORROWER_TIER_LABELS } from "@amanah/shared"
import type { ILoan, BorrowerTier } from "@amanah/shared"
import { IconWallet, IconCheck, IconChevronRight, IconClock } from "../components/Icons"
import { useAuth } from "../hooks/use-auth"

export default function BorrowerDashboard() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ["borrower-loans"],
    queryFn: () => api.get<{ loans: ILoan[] }>("/borrower/loans"),
  })

  const loans = data?.loans ?? []
  const activeLoans = loans.filter((l) => l.status === "active")
  const completedLoans = loans.filter((l) => l.status === "completed")
  const totalBorrowing = activeLoans.reduce((s, l) => s + l.amount, 0)
  const totalPaid = completedLoans.reduce((s, l) => s + l.amount, 0)

  const tierLabel = user?.borrowerTier ? BORROWER_TIER_LABELS[user.borrowerTier as BorrowerTier] : "Peminjam Baru"

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="mb-5">
        <p className="text-sm text-gray-500">Assalamu'alaikum</p>
        <h2 className="text-xl font-bold text-gray-900">{user?.displayName || "Peminjam"}</h2>
        <span className="inline-block mt-1 text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full font-medium">
          {tierLabel}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[var(--color-primary)] text-white rounded-2xl p-4 animate-pulse h-24" />
          <div className="bg-[var(--color-primary-light)] text-white rounded-2xl p-4 animate-pulse h-24" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[var(--color-primary)] text-white rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-10">
              <IconWallet className="w-16 h-16" />
            </div>
            <p className="text-xs opacity-80 font-medium">Sedang Dipinjam</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalBorrowing)}</p>
            <p className="text-xs opacity-60 mt-0.5">{activeLoans.length} pinjaman</p>
          </div>
          <div className="bg-[var(--color-primary-light)] text-white rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-10">
              <IconCheck className="w-16 h-16" />
            </div>
            <p className="text-xs opacity-80 font-medium">Sudah Lunas</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalPaid)}</p>
            <p className="text-xs opacity-60 mt-0.5">{completedLoans.length} pinjaman</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Pinjaman Saya</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center">
            <IconWallet className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">Belum ada pinjaman</p>
          <p className="text-gray-400 text-xs mt-1">Minta pemberi pinjaman untuk mengundang Anda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {loans.slice(0, 5).map((loan) => (
            <Link
              key={loan.id}
              to={`/borrower/loans/${loan.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      loan.status === "active" ? "bg-green-50 text-green-700" :
                      loan.status === "completed" ? "bg-blue-50 text-blue-700" :
                      "bg-gray-50 text-gray-600"
                    }`}>
                      {loan.status === "active" ? "Aktif" : loan.status === "completed" ? "Lunas" : loan.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {loan.purpose === "business_capital" ? "Modal Usaha" :
                       loan.purpose === "home_repair" ? "Renovasi" :
                       loan.purpose === "consumables" ? "Konsumtif" :
                       loan.purpose === "education" ? "Pendidikan" :
                       loan.purpose === "health" ? "Kesehatan" :
                       loan.purpose === "urgent_needs" ? "Mendesak" : "Ibadah"}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.amount)}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>{loan.duration_months} bulan</span>
                    <span className="flex items-center gap-0.5">
                      <IconClock className="w-3 h-3" />
                      {formatDate(loan.created_at)}
                    </span>
                  </div>
                </div>
                <IconChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}