import { useAuthStore } from "../stores/auth-store"
import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import { Link } from "react-router-dom"
import { formatCurrency, formatDate } from "../lib/utils"
import { IconWallet, IconCheck, IconPlus, IconChevronRight, IconClock } from "../components/Icons"
import { LOAN_PURPOSE, LOAN_STATUS } from "@amanah/shared"
import type { ILoan } from "@amanah/shared"

export default function BerandaPage() {
  const user = useAuthStore((s) => s.user)
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Pengguna"

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["loans"],
    queryFn: () => api.get<{ loans: ILoan[] }>("/loans"),
  })

  const { data: appData } = useQuery({
    queryKey: ["lender-applications"],
    queryFn: () => api.get<{ applications: { status: string }[] }>("/lender-app/applications"),
  })

  if (error) {
    return (
      <div className="px-4 pt-4 pb-4 text-center">
        <p className="text-red-500 text-sm mb-2">Gagal memuat data</p>
        <button onClick={() => refetch()} className="text-[var(--color-primary)] text-sm font-medium">Coba Lagi</button>
      </div>
    )
  }

  const loans = data?.loans ?? []
  const activeLoans = loans.filter((l) => l.status === "active")
  const completedLoans = loans.filter((l) => l.status === "completed")
  const totalActive = activeLoans.reduce((s, l) => s + l.amount, 0)
  const totalCompleted = completedLoans.reduce((s, l) => s + l.amount, 0)
  const pendingCount = appData?.applications?.filter((a) => a.status === "pending").length ?? 0

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="mb-5">
        <p className="text-sm text-gray-500">Assalamu'alaikum</p>
        <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
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
            <p className="text-xs opacity-80 font-medium">Total Aktif</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalActive)}</p>
            <p className="text-xs opacity-60 mt-0.5">{activeLoans.length} pinjaman</p>
          </div>
          <div className="bg-[var(--color-primary-light)] text-white rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-10">
              <IconCheck className="w-16 h-16" />
            </div>
            <p className="text-xs opacity-80 font-medium">Sudah Kembali</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalCompleted)}</p>
            <p className="text-xs opacity-60 mt-0.5">{completedLoans.length} pinjaman</p>
          </div>
        </div>
      )}

      {pendingCount > 0 && (
        <Link
          to="/pengajuan"
          className="block bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-800">{pendingCount} Pengajuan Baru</p>
              <p className="text-sm text-amber-600">Menunggu persetujuan Anda</p>
            </div>
            <IconChevronRight className="w-5 h-5 text-amber-400" />
          </div>
        </Link>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Pinjaman Terbaru</h3>
        <Link to="/pinjaman" className="flex items-center gap-0.5 text-sm text-[var(--color-primary)] font-medium">
          Lihat Semua <IconChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center">
            <IconWallet className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">Belum ada pinjaman</p>
          <Link
            to="/pinjaman/baru"
            className="inline-flex items-center gap-1.5 mt-4 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
          >
            <IconPlus className="w-4 h-4" />
            Catat Pinjaman Baru
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {loans.slice(0, 3).map((loan) => (
            <Link
              key={loan.id}
              to={`/pinjaman/${loan.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{loan.borrowerAlias}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <IconClock className="w-3 h-3" />
                    {formatDate(loan.createdAt)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  loan.status === "active" ? "bg-green-50 text-green-700" :
                  loan.status === "completed" ? "bg-blue-50 text-blue-700" :
                  loan.status === "pending" ? "bg-amber-50 text-amber-700" :
                  loan.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                  "bg-gray-50 text-gray-600"
                }`}>
                  {LOAN_STATUS[loan.status] || loan.status}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.amount)}</p>
              <p className="text-xs text-gray-400">{LOAN_PURPOSE[loan.purpose as keyof typeof LOAN_PURPOSE] || loan.purpose}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}