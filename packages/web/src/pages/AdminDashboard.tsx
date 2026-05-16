import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatCurrency } from "../lib/utils"
import { IconUser, IconLoan, IconShield, IconClock, IconCheckCircle, IconArrowRightLeft, IconTrendingUp, IconAlertTriangle } from "../components/Icons"

interface AdminStats {
  userCount: number
  lenderCount: number
  borrowerCount: number
  trusteeCount: number
  loanCount: number
  activeLoans: number
  pendingLoans: number
  completedLoans: number
  pendingRoleChanges: number
  pendingTrustees: number
  totalActiveAmount: number
  loanTrend: { date: string; count: number; amount: number }[]
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get<AdminStats>("/admin/stats"),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const s = stats || {
    userCount: 0, lenderCount: 0, borrowerCount: 0, trusteeCount: 0,
    loanCount: 0, activeLoans: 0, pendingLoans: 0, completedLoans: 0,
    pendingRoleChanges: 0, pendingTrustees: 0, totalActiveAmount: 0,
    loanTrend: [],
  }

  const statCards = [
    {
      label: "Total Pengguna",
      value: s.userCount,
      icon: <IconUser className="w-5 h-5 text-blue-600" />,
      bg: "bg-blue-50",
      detail: `${s.lenderCount} Pemberi · ${s.borrowerCount} Peminjam · ${s.trusteeCount} Wali`,
    },
    {
      label: "Total Pinjaman",
      value: s.loanCount,
      icon: <IconLoan className="w-5 h-5 text-green-600" />,
      bg: "bg-green-50",
      detail: `${s.activeLoans} Aktif · ${s.pendingLoans} Pending · ${s.completedLoans} Lunas`,
    },
    {
      label: "Dana Aktif",
      value: formatCurrency(s.totalActiveAmount),
      icon: <IconTrendingUp className="w-5 h-5 text-amber-600" />,
      bg: "bg-amber-50",
      detail: "Sedang beredar",
    },
    {
      label: "Menunggu Tindakan",
      value: s.pendingRoleChanges + s.pendingTrustees,
      icon: <IconAlertTriangle className="w-5 h-5 text-red-600" />,
      bg: "bg-red-50",
      detail: `${s.pendingRoleChanges} Role · ${s.pendingTrustees} Wali`,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Ringkasan sistem Amanah</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${card.bg} dark:bg-opacity-20 flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">{card.label}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">{card.detail}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Tindakan Cepat</h3>
        <div className="grid grid-cols-3 gap-4">
          {s.pendingRoleChanges > 0 && (
            <a href="/admin/role-changes" className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-[var(--color-primary)] hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
                <IconArrowRightLeft className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.pendingRoleChanges} Permintaan Role</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Perlu ditinjau</p>
              </div>
            </a>
          )}
          {s.pendingTrustees > 0 && (
            <a href="/admin/trustees" className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-[var(--color-primary)] hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <IconShield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.pendingTrustees} Wali Belum Verifikasi</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Perlu diverifikasi</p>
              </div>
            </a>
          )}
          <a href="/admin/users" className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-[var(--color-primary)] hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <IconUser className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Kelola Pengguna</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Lihat semua user</p>
            </div>
          </a>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Distribusi Pengguna</h3>
          <div className="space-y-3">
            {[
              { label: "Pemberi Pinjaman", count: s.lenderCount, color: "bg-blue-500", total: s.userCount },
              { label: "Peminjam", count: s.borrowerCount, color: "bg-green-500", total: s.userCount },
              { label: "Wali Amanah", count: s.trusteeCount, color: "bg-purple-500", total: s.userCount },
              { label: "Admin", count: 1, color: "bg-red-500", total: s.userCount },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-slate-400 w-36">{item.label}</span>
                <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-2.5">
                  <div
                    className={`${item.color} h-2.5 rounded-full`}
                    style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Status Pinjaman</h3>
          <div className="space-y-3">
            {[
              { label: "Aktif", count: s.activeLoans, color: "bg-green-500", total: s.loanCount },
              { label: "Menunggu", count: s.pendingLoans, color: "bg-yellow-500", total: s.loanCount },
              { label: "Lunas", count: s.completedLoans, color: "bg-gray-400", total: s.loanCount },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-slate-400 w-36">{item.label}</span>
                <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-2.5">
                  <div
                    className={`${item.color} h-2.5 rounded-full`}
                    style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loan Trend Chart */}
      {s.loanTrend.length > 0 && (
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Tren Pinjaman (7 Hari Terakhir)</h3>
          <div className="flex items-end gap-2 h-40">
            {s.loanTrend.map((day) => {
              const maxCount = Math.max(...s.loanTrend.map((d) => d.count), 1)
              const height = Math.max((day.count / maxCount) * 100, 4)
              const dateLabel = new Date(day.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{day.count}</span>
                  <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-t-lg relative" style={{ height: "120px" }}>
                    <div
                      className="absolute bottom-0 w-full bg-[var(--color-primary)] rounded-t-lg transition-all"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">{dateLabel}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
