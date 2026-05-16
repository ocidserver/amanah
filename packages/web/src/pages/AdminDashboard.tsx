import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatCurrency } from "../lib/utils"
import { useI18n } from "../hooks/use-i18n"
import { IconUser, IconLoan, IconShield, IconClock, IconCheckCircle, IconArrowRightLeft, IconTrendingUp, IconAlertTriangle, IconChartBar, IconMap } from "../components/Icons"

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
  const { t, language } = useI18n()

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get<AdminStats>("/admin/stats"),
  })

  const { data: growthData } = useQuery({
    queryKey: ["admin-user-growth"],
    queryFn: () => api.get<{ newUsers: number; activeToday: number; growthRate: number; userGrowth?: { date: string; count: number }[]; loanByRegion?: { region: string; count: number; amount: number }[] }>("/admin/user-growth"),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-label={t("common.loading")}>
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <span className="sr-only">{t("common.loading")}</span>
      </div>
    )
  }

  const s = stats || {
    userCount: 0, lenderCount: 0, borrowerCount: 0, trusteeCount: 0,
    loanCount: 0, activeLoans: 0, pendingLoans: 0, completedLoans: 0,
    pendingRoleChanges: 0, pendingTrustees: 0, totalActiveAmount: 0,
    loanTrend: [], userGrowth: [], loanByRegion: [],
  }

  const g = growthData || { newUsers: 0, activeToday: 0, growthRate: 0 }

  const statCards = [
    {
      label: t("admin.totalUsers"),
      value: s.userCount,
      icon: <IconUser className="w-5 h-5 text-blue-600" />,
      bg: "bg-blue-50 dark:bg-blue-900/20",
      detail: `${s.lenderCount} ${t("admin.lender")} · ${s.borrowerCount} ${t("admin.borrower")} · ${s.trusteeCount} ${t("admin.trusteeRole")}`,
    },
    {
      label: t("admin.totalLoans"),
      value: s.loanCount,
      icon: <IconLoan className="w-5 h-5 text-green-600" />,
      bg: "bg-green-50 dark:bg-green-900/20",
      detail: `${s.activeLoans} ${t("loan.active")} · ${s.pendingLoans} ${t("loan.pending")} · ${s.completedLoans} ${t("loan.completed")}`,
    },
    {
      label: t("admin.activeFunds"),
      value: formatCurrency(s.totalActiveAmount),
      icon: <IconTrendingUp className="w-5 h-5 text-amber-600" />,
      bg: "bg-amber-50 dark:bg-amber-900/20",
      detail: t("admin.circulating"),
    },
    {
      label: t("admin.pendingActions"),
      value: s.pendingRoleChanges + s.pendingTrustees,
      icon: <IconAlertTriangle className="w-5 h-5 text-red-600" />,
      bg: "bg-red-50 dark:bg-red-900/20",
      detail: `${s.pendingRoleChanges} ${t("profile.changeRole")} · ${s.pendingTrustees} ${t("admin.trusteeRole")}`,
    },
  ]

  const userGrowthData = growthData?.userGrowth || []
  const loanByRegion = growthData?.loanByRegion || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("admin.dashboard")}</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">{t("admin.systemSummary")}</p>
      </div>

      {/* Quick Stats Row */}
      {g.newUsers > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <IconUser className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{g.newUsers}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{t("admin.newUsers")}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <IconCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{g.activeToday}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{t("admin.activeToday")}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <IconTrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{g.growthRate > 0 ? "+" : ""}{g.growthRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{t("admin.userGrowth")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
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
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("admin.quickActions")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {s.pendingRoleChanges > 0 && (
            <a href="/admin/role-changes" className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-[var(--color-primary)] hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
                <IconArrowRightLeft className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.pendingRoleChanges} {t("admin.roleRequests")}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{t("admin.needsReview")}</p>
              </div>
            </a>
          )}
          {s.pendingTrustees > 0 && (
            <a href="/admin/trustees" className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-[var(--color-primary)] hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <IconShield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.pendingTrustees} {t("admin.unverifiedTrustees")}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{t("admin.needsVerification")}</p>
              </div>
            </a>
          )}
          <a href="/admin/users" className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-[var(--color-primary)] hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <IconUser className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("admin.manageUsers")}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{t("admin.viewAllUsers")}</p>
            </div>
          </a>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* User Distribution */}
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("admin.userDistribution")}</h3>
          <div className="space-y-3">
            {[
              { label: t("admin.lender"), count: s.lenderCount, color: "bg-blue-500", total: s.userCount },
              { label: t("admin.borrower"), count: s.borrowerCount, color: "bg-green-500", total: s.userCount },
              { label: t("admin.trusteeRole"), count: s.trusteeCount, color: "bg-purple-500", total: s.userCount },
              { label: t("admin.adminRole"), count: 1, color: "bg-red-500", total: s.userCount },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-slate-400 w-36">{item.label}</span>
                <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-2.5" role="progressbar" aria-valuenow={item.count} aria-valuemin={0} aria-valuemax={item.total}>
                  <div
                    className={`${item.color} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loan Status */}
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("admin.loanStatus")}</h3>
          <div className="space-y-3">
            {[
              { label: t("loan.active"), count: s.activeLoans, color: "bg-green-500", total: s.loanCount },
              { label: t("loan.pending"), count: s.pendingLoans, color: "bg-yellow-500", total: s.loanCount },
              { label: t("loan.completed"), count: s.completedLoans, color: "bg-gray-400", total: s.loanCount },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-slate-400 w-36">{item.label}</span>
                <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-2.5" role="progressbar" aria-valuenow={item.count} aria-valuemin={0} aria-valuemax={item.total}>
                  <div
                    className={`${item.color} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Growth Chart */}
      {userGrowthData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <IconChartBar className="w-5 h-5 text-gray-500 dark:text-slate-400" aria-hidden="true" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t("admin.userGrowth")}</h3>
            <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">{t("admin.last30Days")}</span>
          </div>
          <div className="flex items-end gap-1.5 h-40" role="img" aria-label={t("admin.userGrowth")}>
            {userGrowthData.map((day) => {
              const maxCount = Math.max(...userGrowthData.map((d) => d.count), 1)
              const height = Math.max((day.count / maxCount) * 100, 4)
              const dateLabel = new Date(day.date).toLocaleDateString(language === "id" ? "id-ID" : "en-US", { day: "numeric", month: "short" })
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">{day.count}</span>
                  <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-t-lg relative" style={{ height: "120px" }}>
                    <div
                      className="absolute bottom-0 w-full bg-[var(--color-primary)] dark:bg-[var(--color-primary-light)] rounded-t-lg transition-all duration-300 group-hover:opacity-80"
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

      {/* Loan Trend Chart */}
      {s.loanTrend.length > 0 && (
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <IconTrendingUp className="w-5 h-5 text-gray-500 dark:text-slate-400" aria-hidden="true" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t("admin.loanTrend")}</h3>
          </div>
          <div className="flex items-end gap-2 h-40" role="img" aria-label={t("admin.loanTrend")}>
            {s.loanTrend.map((day) => {
              const maxCount = Math.max(...s.loanTrend.map((d) => d.count), 1)
              const height = Math.max((day.count / maxCount) * 100, 4)
              const dateLabel = new Date(day.date).toLocaleDateString(language === "id" ? "id-ID" : "en-US", { day: "numeric", month: "short" })
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">{day.count}</span>
                  <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-t-lg relative" style={{ height: "120px" }}>
                    <div
                      className="absolute bottom-0 w-full bg-[var(--color-primary)] dark:bg-[var(--color-primary-light)] rounded-t-lg transition-all duration-300 group-hover:opacity-80"
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

      {/* Loan Distribution Map (Region-based) */}
      {loanByRegion.length > 0 && (
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <IconMap className="w-5 h-5 text-gray-500 dark:text-slate-400" aria-hidden="true" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t("admin.loanMap")}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loanByRegion.map((region) => {
              const maxAmount = Math.max(...loanByRegion.map((r) => r.amount), 1)
              const intensity = Math.max((region.amount / maxAmount) * 100, 10)
              return (
                <div
                  key={region.region}
                  className="rounded-lg p-4 border border-gray-200 dark:border-slate-700 transition-colors hover:border-[var(--color-primary)]"
                  style={{
                    backgroundColor: `rgba(27, 67, 50, ${intensity / 200})`,
                  }}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{region.region}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{region.count} {t("admin.loans").toLowerCase()}</p>
                  <p className="text-sm font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary-light)] mt-1">{formatCurrency(region.amount)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
