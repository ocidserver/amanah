import { useAuthStore } from "../stores/auth-store"
import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import { Link } from "react-router-dom"
import { formatCurrency, formatDate } from "../lib/utils"
import { useI18n } from "../hooks/use-i18n"
import { IconWallet, IconCheck, IconPlus, IconChevronRight, IconClock, IconTrendingUp } from "../components/Icons"
import { LOAN_PURPOSE, LOAN_STATUS } from "@amanah/shared"
import type { ILoan } from "@amanah/shared"

export default function BerandaPage() {
  const user = useAuthStore((s) => s.user)
  const { t, language } = useI18n()
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Pengguna"

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["loans"],
    queryFn: () => api.get<{ loans: ILoan[] }>("/loans"),
    refetchInterval: 30000,
  })

  const { data: appData } = useQuery({
    queryKey: ["lender-applications"],
    queryFn: () => api.get<{ applications: { status: string }[] }>("/lender-app/applications"),
    refetchInterval: 30000,
  })

  const { data: pendingProofsData } = useQuery({
    queryKey: ["pending-payment-proofs"],
    queryFn: () => api.get<{ count: number }>("/payment-proofs/pending"),
    refetchInterval: 30000,
  })

  const { data: analytics } = useQuery({
    queryKey: ["loans-analytics"],
    queryFn: () => api.get<{
      totalLoans: number
      activeLoans: number
      completedLoans: number
      defaultedLoans: number
      cancelledLoans: number
      totalDisbursed: number
      totalReturned: number
      totalOutstanding: number
      repaymentRate: number
      monthlyData: { month: string; count: number; amount: number }[]
      purposeBreakdown: { purpose: string; count: number }[]
    }>("/loans/analytics"),
  })

  const pendingProofsCount = pendingProofsData?.count ?? 0

  if (error) {
    return (
      <div className="px-4 pt-4 pb-4 text-center" role="alert">
        <p className="text-red-500 text-sm mb-2">{t("common.error")}</p>
        <button onClick={() => refetch()} className="text-[var(--color-primary)] text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded px-2 py-1">{t("common.retry")}</button>
      </div>
    )
  }

  const loans = data?.loans ?? []
  const activeLoans = loans.filter((l) => l.status === "active")
  const completedLoans = loans.filter((l) => l.status === "completed")
  const totalActive = activeLoans.reduce((s, l) => s + l.amount, 0)
  const totalCompleted = completedLoans.reduce((s, l) => s + l.amount, 0)
  const pendingCount = appData?.applications?.filter((a) => a.status === "pending").length ?? 0

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentlyActivated = activeLoans.filter((l) => new Date(l.updatedAt || l.createdAt) >= sevenDaysAgo)

  const statusLabels: Record<string, string> = {
    active: t("loan.active"),
    completed: t("loan.completed"),
    pending: t("loan.pending"),
    approved: t("loan.approved"),
    cancelled: t("loan.cancelled"),
    defaulted: t("loan.defaulted"),
    rejected: t("loan.rejected"),
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="mb-5">
        <p className="text-sm text-gray-500 dark:text-slate-400">Assalamu&apos;alaikum</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{displayName}</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mb-6" role="status" aria-label={t("common.loading")}>
          <div className="bg-[var(--color-primary)] text-white rounded-2xl p-4 animate-pulse h-24" />
          <div className="bg-[var(--color-primary-light)] text-white rounded-2xl p-4 animate-pulse h-24" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[var(--color-primary)] text-white rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-10" aria-hidden="true">
              <IconWallet className="w-16 h-16" />
            </div>
            <p className="text-xs opacity-80 font-medium">{t("loan.totalActive")}</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalActive)}</p>
            <p className="text-xs opacity-60 mt-0.5">{activeLoans.length} {t("admin.loans").toLowerCase()}</p>
          </div>
          <div className="bg-[var(--color-primary-light)] text-white rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-10" aria-hidden="true">
              <IconCheck className="w-16 h-16" />
            </div>
            <p className="text-xs opacity-80 font-medium">{t("loan.totalCompleted")}</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalCompleted)}</p>
            <p className="text-xs opacity-60 mt-0.5">{completedLoans.length} {t("admin.loans").toLowerCase()}</p>
          </div>
        </div>
      )}

      {pendingCount > 0 && (
        <Link
          to="/pengajuan"
          className="block bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 mb-4 active:scale-[0.99] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">{pendingCount} {t("loan.pending")}</p>
              <p className="text-sm text-amber-600 dark:text-amber-400">{t("admin.needsReview")}</p>
            </div>
            <IconChevronRight className="w-5 h-5 text-amber-400" aria-hidden="true" />
          </div>
        </Link>
      )}

      {recentlyActivated.length > 0 && (
        <Link
          to="/pinjaman"
          className="block bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-2xl p-4 mb-4 active:scale-[0.99] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">{recentlyActivated.length} {t("loan.active")}</p>
              <p className="text-sm text-green-600 dark:text-green-400">{t("loan.pendingApproval")}</p>
            </div>
            <IconTrendingUp className="w-5 h-5 text-green-400" aria-hidden="true" />
          </div>
        </Link>
      )}

      {pendingProofsCount > 0 && (
        <Link
          to="/bukti-bayar"
          className="block bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-2xl p-4 mb-4 active:scale-[0.99] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-300">{pendingProofsCount} {t("proof.pending")}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">{t("loan.verifyProof")}</p>
            </div>
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold" aria-hidden="true">
              {pendingProofsCount}
            </div>
          </div>
        </Link>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t("loan.recentLoans")}</h3>
        <Link to="/pinjaman" className="flex items-center gap-0.5 text-sm text-[var(--color-primary)] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded px-1">
          {t("loan.seeAll")} <IconChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3" role="status" aria-label={t("common.loading")}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center" aria-hidden="true">
            <IconWallet className="w-6 h-6 text-gray-300 dark:text-slate-500" />
          </div>
          <p className="text-gray-400 dark:text-slate-400 text-sm">{t("loan.noLoans")}</p>
          <Link
            to="/pinjaman/baru"
            className="inline-flex items-center gap-1.5 mt-4 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <IconPlus className="w-4 h-4" aria-hidden="true" />
            {t("loan.createFirst")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {loans.slice(0, 3).map((loan) => (
            <Link
              key={loan.id}
              to={`/pinjaman/${loan.id}`}
              className="block bg-white dark:bg-slate-800 dark:border-slate-700 rounded-2xl border border-gray-100 p-4 active:scale-[0.99] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{loan.borrowerAlias}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                    <IconClock className="w-3 h-3" aria-hidden="true" />
                    {formatDate(loan.createdAt)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  loan.status === "active" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                  loan.status === "completed" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                  loan.status === "pending" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                  loan.status === "approved" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                  "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                }`}>
                  {statusLabels[loan.status] || loan.status}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(loan.amount)}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">{LOAN_PURPOSE[loan.purpose as keyof typeof LOAN_PURPOSE] || loan.purpose}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Analytics Section */}
      {analytics && loans.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t("analytics.overview")}</h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 dark:text-slate-400">{t("analytics.repaymentRate")}</p>
              <p className="text-2xl font-bold text-[var(--color-primary)] mt-1">{analytics.repaymentRate}%</p>
              <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 mt-2" role="progressbar" aria-valuenow={analytics.repaymentRate} aria-valuemin={0} aria-valuemax={100}>
                <div className="bg-[var(--color-primary)] h-1.5 rounded-full transition-all" style={{ width: `${analytics.repaymentRate}%` }} />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 dark:text-slate-400">{t("analytics.totalDisbursed")}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{formatCurrency(analytics.totalDisbursed)}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{analytics.totalLoans} {t("admin.loans").toLowerCase()}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 dark:text-slate-400">{t("analytics.totalReturned")}</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(analytics.totalReturned)}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{analytics.completedLoans} {t("admin.loans").toLowerCase()}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 dark:text-slate-400">{t("analytics.outstanding")}</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(analytics.totalOutstanding)}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{analytics.activeLoans} {t("admin.loans").toLowerCase()}</p>
            </div>
          </div>

          {/* Monthly Trend */}
          {analytics.monthlyData.some((m) => m.count > 0) && (
            <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-100 p-4 mb-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t("analytics.monthlyTrend")}</p>
              <div className="flex items-end gap-2 h-24" role="img" aria-label={t("analytics.monthlyTrend")}>
                {analytics.monthlyData.map((m) => {
                  const maxCount = Math.max(...analytics.monthlyData.map((d) => d.count), 1)
                  const height = m.count > 0 ? Math.max((m.count / maxCount) * 100, 8) : 0
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      {m.count > 0 && (
                        <span className="text-[10px] text-gray-500 dark:text-slate-400">{m.count}</span>
                      )}
                      <div
                        className="w-full bg-[var(--color-primary)] dark:bg-[var(--color-primary-light)] rounded-t-sm transition-all min-h-[2px]"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">{m.month}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Purpose Breakdown */}
          {analytics.purposeBreakdown.length > 0 && (
            <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t("analytics.purposeBreakdown")}</p>
              <div className="space-y-2">
                {analytics.purposeBreakdown
                  .sort((a, b) => b.count - a.count)
                  .map((p) => {
                    const pct = Math.round((p.count / analytics.totalLoans) * 100)
                    return (
                      <div key={p.purpose} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 dark:text-slate-400 w-32 truncate">
                          {LOAN_PURPOSE[p.purpose as keyof typeof LOAN_PURPOSE] || p.purpose}
                        </span>
                        <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                          <div
                            className="bg-[var(--color-primary-light)] h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-slate-400 w-10 text-right">{p.count}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
