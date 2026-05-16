import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { LOAN_PURPOSE, BORROWER_TIER_LABELS } from "@amanah/shared"
import type { ILoan, BorrowerTier } from "@amanah/shared"
import { IconWallet, IconCheck, IconChevronRight, IconClock, IconPlus, IconShield, IconUser } from "../components/Icons"
import { useAuth } from "../hooks/use-auth"
import { useI18n } from "../hooks/use-i18n"

export default function BorrowerDashboard() {
  const { user } = useAuth()
  const { t, language } = useI18n()

  const { data, isLoading } = useQuery({
    queryKey: ["borrower-loans"],
    queryFn: () => api.get<{ loans: ILoan[] }>("/borrower/loans"),
    refetchInterval: 30000,
  })

  const { data: biData } = useQuery({
    queryKey: ["borrower-bi-status"],
    queryFn: () => api.get<{ status: string; canApply: boolean }>("/borrower-app/can-apply"),
    enabled: !!user?.profileCompleted,
    refetchInterval: 30000,
  })

  const loans = data?.loans ?? []
  const activeLoans = loans.filter((l) => l.status === "active")
  const completedLoans = loans.filter((l) => l.status === "completed")
  const pendingLoans = loans.filter((l) => l.status === "pending")
  const approvedLoans = loans.filter((l) => l.status === "approved")
  const totalBorrowing = activeLoans.reduce((s, l) => s + l.amount, 0)
  const totalPaid = completedLoans.reduce((s, l) => s + l.amount, 0)

  const tierLabel = user?.borrowerTier ? BORROWER_TIER_LABELS[user.borrowerTier as BorrowerTier] : "Peminjam Baru"

  const isProfileComplete = user?.profileCompleted
  const biStatus = biData?.status
  const biApproved = biData?.canApply

  const onboardingStep = !isProfileComplete
    ? "profile"
    : biStatus === "approved"
    ? "done"
    : biStatus === "rejected"
    ? "bi-rejected"
    : biStatus === "pending"
    ? "bi-pending"
    : "bi-check"

  const showOnboardingBanner = onboardingStep !== "done"

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
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user?.displayName || t("role.borrower")}</h2>
        <span className="inline-block mt-1 text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full font-medium">
          {tierLabel}
        </span>
      </div>

      {showOnboardingBanner && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t("borrower.onboarding")}</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isProfileComplete ? "bg-green-100 dark:bg-green-900/30" : "bg-[var(--color-primary)]"
              }`}>
                {isProfileComplete ? (
                  <IconCheck className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                ) : (
                  <IconUser className="w-4 h-4 text-white" aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isProfileComplete ? "text-green-700 dark:text-green-400" : "text-gray-900 dark:text-gray-100"}`}>
                  {isProfileComplete ? t("profile.profileCompleted") : t("borrower.fillProfile")}
                </p>
                {!isProfileComplete && (
                  <p className="text-xs text-gray-400 dark:text-slate-500">Nama, NIK, alamat, pekerjaan</p>
                )}
              </div>
              {!isProfileComplete && (
                <Link to="/borrower/onboarding" className="text-xs text-[var(--color-primary)] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded px-1">
                  {t("profile.completeProfile")} →
                </Link>
              )}
            </div>

            {isProfileComplete && (
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  biStatus === "approved" ? "bg-green-100 dark:bg-green-900/30" : biStatus === "rejected" ? "bg-red-100 dark:bg-red-900/30" : biStatus === "pending" ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-gray-100 dark:bg-slate-700"
                }`}>
                  {biStatus === "approved" ? (
                    <IconCheck className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                  ) : biStatus === "rejected" ? (
                    <IconClock className="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                  ) : biStatus === "pending" ? (
                    <IconClock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                  ) : (
                    <IconShield className="w-4 h-4 text-gray-400 dark:text-slate-500" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    biStatus === "approved" ? "text-green-700 dark:text-green-400" : biStatus === "rejected" ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-gray-100"
                  }`}>
                    {biStatus === "approved" ? t("borrower.approved") : biStatus === "rejected" ? t("borrower.rejected") : biStatus === "pending" ? t("loan.pending") : t("borrower.biCheck")}
                  </p>
                  {biStatus === "rejected" && (
                    <p className="text-xs text-red-500 dark:text-red-400">Hubungi admin untuk info lebih lanjut</p>
                  )}
                  {biStatus === "pending" && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">{t("common.loading")}</p>
                  )}
                </div>
                {biStatus !== "approved" && biStatus !== "pending" && (
                  <Link to="/borrower/onboarding" className="text-xs text-[var(--color-primary)] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded px-1">
                    {biStatus === "rejected" ? `${t("common.retry")} →` : `${t("borrower.biCheck")} →`}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mb-6" role="status" aria-label={t("common.loading")}>
          <div className="bg-[var(--color-primary)] text-white rounded-2xl p-4 animate-pulse h-24" />
          <div className="bg-[var(--color-primary-light)] text-white rounded-2xl p-4 animate-pulse h-24" />
        </div>
      ) : (
        <>
          {(pendingLoans.length > 0 || approvedLoans.length > 0) && (
            <div className="mb-6">
              {pendingLoans.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-amber-800 dark:text-amber-400">{pendingLoans.length} {t("loan.pending")}</p>
                      <p className="text-sm text-amber-600 dark:text-amber-400">{t("borrower.waitingApproval")}</p>
                    </div>
                    <Link to="/borrower/pengajuan" className="text-sm text-amber-700 dark:text-amber-400 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded px-1">
                      {t("loan.seeAll")} →
                    </Link>
                  </div>
                </div>
              )}
              {approvedLoans.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-blue-800 dark:text-blue-400">{approvedLoans.length} {t("loan.approved")}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">{t("loan.pendingApproval")}</p>
                    </div>
                    <Link to="/borrower/pengajuan" className="text-sm text-blue-700 dark:text-blue-400 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded px-1">
                      {t("loan.seeAll")} →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[var(--color-primary)] text-white rounded-2xl p-4 relative overflow-hidden">
              <div className="absolute -right-2 -top-2 opacity-10" aria-hidden="true">
                <IconWallet className="w-16 h-16" />
              </div>
              <p className="text-xs opacity-80 font-medium">{t("borrower.totalBorrowed")}</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalBorrowing)}</p>
              <p className="text-xs opacity-60 mt-0.5">{activeLoans.length} {t("admin.loans").toLowerCase()}</p>
            </div>
            <div className="bg-[var(--color-primary-light)] text-white rounded-2xl p-4 relative overflow-hidden">
              <div className="absolute -right-2 -top-2 opacity-10" aria-hidden="true">
                <IconCheck className="w-16 h-16" />
              </div>
              <p className="text-xs opacity-80 font-medium">{t("loan.completed")}</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalPaid)}</p>
              <p className="text-xs opacity-60 mt-0.5">{completedLoans.length} {t("admin.loans").toLowerCase()}</p>
            </div>
          </div>

          <Link
            to={biApproved ? "/borrower/pengajuan" : "/borrower/onboarding"}
            className="flex items-center justify-center gap-2 w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold mb-6 active:scale-[0.99] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
          >
            <IconPlus className="w-5 h-5" aria-hidden="true" />
            {biApproved ? t("borrower.apply") : t("profile.completeProfile")}
          </Link>

          {(pendingLoans.length > 0 || approvedLoans.length > 0) && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t("loan.status")}</h3>
              <div className="space-y-2">
                {pendingLoans.map((loan) => (
                  <Link
                    key={loan.id}
                    to={`/borrower/pinjaman/${loan.id}`}
                    className="block bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">{t("loan.pending")}</span>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">{formatCurrency(loan.amount)}</p>
                      </div>
                      <IconChevronRight className="w-5 h-5 text-amber-400 dark:text-amber-500" aria-hidden="true" />
                    </div>
                  </Link>
                ))}
                {approvedLoans.map((loan) => (
                  <Link
                    key={loan.id}
                    to={`/borrower/pinjaman/${loan.id}`}
                    className="block bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">{t("loan.approved")}</span>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">{formatCurrency(loan.amount)}</p>
                      </div>
                      <IconChevronRight className="w-5 h-5 text-green-400 dark:text-green-500" aria-hidden="true" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t("borrower.myLoans")}</h3>
          </div>

          {loans.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center" aria-hidden="true">
                <IconWallet className="w-6 h-6 text-gray-300 dark:text-slate-600" />
              </div>
              <p className="text-gray-400 dark:text-slate-500 text-sm">{t("borrower.noLoans")}</p>
              <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">{t("borrower.applyNow")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.slice(0, 5).map((loan) => (
                <Link
                  key={loan.id}
                  to={`/borrower/pinjaman/${loan.id}`}
                  className="block bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 active:scale-[0.99] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  aria-label={`${formatCurrency(loan.amount)} - ${statusLabels[loan.status] || loan.status}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          loan.status === "active" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                          loan.status === "completed" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                          loan.status === "pending" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                          loan.status === "approved" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                          loan.status === "rejected" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                          "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                        }`}>
                          {statusLabels[loan.status] || loan.status}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400">
                          {LOAN_PURPOSE[loan.purpose as keyof typeof LOAN_PURPOSE] || loan.purpose}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(loan.amount)}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500 mt-1">
                        <span>{loan.durationMonths} {t("loan.months")}</span>
                        <span className="flex items-center gap-0.5">
                          <IconClock className="w-3 h-3" aria-hidden="true" />
                          {formatDate(loan.createdAt)}
                        </span>
                      </div>
                    </div>
                    <IconChevronRight className="w-5 h-5 text-gray-300 dark:text-slate-600 shrink-0" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
