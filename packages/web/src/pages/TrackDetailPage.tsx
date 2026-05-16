import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { formatCurrency, formatDate } from "../lib/utils"
import { IconChevronLeft, IconClock, IconCheck, IconShield, IconSun, IconMoon } from "../components/Icons"
import { LOAN_PURPOSE, LOAN_STATUS, INSTALLMENT_STATUS } from "@amanah/shared"
import { useThemeStore } from "../stores/theme-store"
import type { IInstallment } from "@amanah/shared"

interface TrackLoanResponse {
  loan: {
    id: string
    loanCode: string | null
    borrowerAlias: string
    amount: number
    durationMonths: number
    installmentType: string
    purpose: string
    collateralType: string
    collateralStatus: string
    status: string
    doaLunasEnabled: boolean
    startDate: string | null
    dueDate: string | null
    completedAt: string | null
    createdAt: string
  }
  installments: IInstallment[]
  lender: { id: string; displayName: string | null; lenderTier: string | null } | null
  completionMessage: { id: string; message: string; createdAt: string } | null
}

export default function TrackDetailPage() {
  const { loanCode } = useParams<{ loanCode: string }>()
  const { isDark, toggle } = useThemeStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ["track-loan", loanCode],
    queryFn: () =>
      fetch(`/api/loans/code/${loanCode}`).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Not found" }))
          throw new Error(err.error || "Pinjaman tidak ditemukan")
        }
        return res.json() as Promise<TrackLoanResponse>
      }),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--color-surface-alt)]">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data?.loan) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center bg-[var(--color-surface-alt)]">
        <IconShield className="w-12 h-12 text-[var(--color-text-muted)] mb-4" />
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">Pinjaman Tidak Ditemukan</h2>
        <p className="text-[var(--color-text-secondary)] text-sm mb-6">
          {error instanceof Error ? error.message : "Kode pinjaman tidak valid atau sudah tidak aktif."}
        </p>
        <Link
          to="/track"
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-6 py-2.5 rounded-xl font-medium active:scale-[0.98] transition-transform"
        >
          Kembali ke Lacak Pinjaman
        </Link>
      </div>
    )
  }

  const { loan, installments, lender, completionMessage } = data
  const paidCount = installments.filter((i) => i.status === "paid").length
  const totalPaid = installments.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0)
  const progress = installments.length > 0 ? Math.round((paidCount / installments.length) * 100) : 0
  const allPaid = installments.length > 0 && paidCount === installments.length

  return (
    <div className="min-h-dvh bg-[var(--color-surface-alt)] text-[var(--color-text)]">
      <nav className="sticky top-0 z-40 bg-[var(--color-surface)]/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/track" className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
            <IconChevronLeft className="w-4 h-4" /> Kembali
          </Link>
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
            aria-label={isDark ? "Mode terang" : "Mode gelap"}
          >
            {isDark ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
        {/* Loan Code Badge */}
        <div className="text-center mb-4">
          <span className="inline-block bg-[var(--color-surface)] dark:bg-slate-800 border border-[var(--color-border)] text-[var(--color-text)] font-mono text-sm px-3 py-1 rounded-lg">
            {loan.loanCode}
          </span>
        </div>

        {/* Loan Summary */}
        <div className="bg-[var(--color-primary)] text-white rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium bg-white/20 px-2.5 py-0.5 rounded-full">
              {LOAN_PURPOSE[loan.purpose as keyof typeof LOAN_PURPOSE] || loan.purpose}
            </span>
            <span className="text-sm font-medium bg-white/20 px-2.5 py-0.5 rounded-full">
              {LOAN_STATUS[loan.status as keyof typeof LOAN_STATUS] || loan.status}
            </span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(loan.amount)}</p>
          <p className="text-sm opacity-70 mt-1">{loan.borrowerAlias} · {loan.durationMonths} bulan</p>
          {lender && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs opacity-70">Pemberi Pinjaman</p>
              <p className="font-medium">{lender.displayName || "Tanpa Nama"}</p>
            </div>
          )}
        </div>

        {/* Progress */}
        {installments.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[var(--color-text)]">Progress Cicilan</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{paidCount}/{installments.length} · {progress}%</p>
            </div>
            <div className="h-2.5 bg-[var(--color-surface-hover)] dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${allPaid ? "bg-[var(--color-success)]" : "bg-[var(--color-primary)]"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-[var(--color-text-secondary)]">
              <span>Terbayar: {formatCurrency(totalPaid)}</span>
              <span>Sisa: {formatCurrency(loan.amount - totalPaid)}</span>
            </div>
          </div>
        )}

        {/* Installments */}
        <h3 className="font-semibold text-[var(--color-text)] mb-3">Jadwal Cicilan</h3>
        {installments.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-sm">Belum ada cicilan</p>
        ) : (
          <div className="space-y-2">
            {installments.map((inst) => (
              <div key={inst.id} className="bg-[var(--color-surface)] dark:bg-slate-800 rounded-xl border border-[var(--color-border)] px-4 py-3 flex items-center gap-3">
                {inst.status === "paid" ? (
                  <div className="w-8 h-8 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center shrink-0">
                    <IconCheck className="w-4 h-4 text-[var(--color-success)]" />
                  </div>
                ) : inst.status === "processing" ? (
                  <div className="w-8 h-8 rounded-full bg-[var(--color-warning-bg)] flex items-center justify-center shrink-0">
                    <IconClock className="w-4 h-4 text-[var(--color-warning)]" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface-hover)] dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <IconClock className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-text)] text-sm">{inst.periodLabel}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDate(inst.dueDate)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-[var(--color-text)] text-sm">{formatCurrency(inst.amount)}</p>
                  <p className={`text-xs ${
                    inst.status === "paid" ? "text-[var(--color-success)]" :
                    inst.status === "processing" ? "text-[var(--color-warning)]" :
                    "text-[var(--color-text-muted)]"
                  }`}>
                    {INSTALLMENT_STATUS[inst.status as keyof typeof INSTALLMENT_STATUS] || inst.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completion Message */}
        {completionMessage && (
          <div className="mt-6">
            <h3 className="font-semibold text-[var(--color-text)] mb-3">Doa Lunas</h3>
            <div className="bg-[var(--color-success-bg)] border border-[var(--color-success-border)] rounded-xl p-4">
              <p className="text-sm text-[var(--color-success)] italic">"{completionMessage.message}"</p>
              <p className="text-xs text-[var(--color-success)] mt-2">{formatDate(completionMessage.createdAt)}</p>
            </div>
          </div>
        )}

        {/* All Paid + No Doa Lunas */}
        {allPaid && !completionMessage && loan.doaLunasEnabled && (
          <div className="mt-6 bg-[var(--color-success-bg)] border border-[var(--color-success-border)] rounded-xl p-4 text-center">
            <IconCheck className="w-8 h-8 text-[var(--color-success)] mx-auto mb-2" />
            <p className="font-semibold text-[var(--color-success)]">Semua cicilan telah lunas!</p>
            <p className="text-sm text-[var(--color-success)] mt-1">
              Silakan hubungi pemberi pinjaman untuk mengirim doa lunas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
