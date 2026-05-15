import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { IconChevronLeft, IconClock, IconCheck } from "../components/Icons"
import { LOAN_PURPOSE, LOAN_STATUS } from "@amanah/shared"
import type { ILoan, IInstallment, ICompletionMessage } from "@amanah/shared"

export default function PinjamanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["loan", id],
    queryFn: () => api.get<{ loan: ILoan; installments: IInstallment[]; borrower: { id: string; displayName: string | null; email: string; borrowerTier: string | null } | null }>(`/loans/${id}`),
  })

  const { data: completionData } = useQuery({
    queryKey: ["completion-messages", id],
    queryFn: () => api.get<{ message: ICompletionMessage | null }>(`/completion-messages/loan/${id}`),
    enabled: !!id,
  })

  const confirmMutation = useMutation({
    mutationFn: (installmentId: string) =>
      api.patch<{ installment: IInstallment }>(`/installments/${installmentId}/confirm`, {
        status: "paid",
        confirmedBy: "lender",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loan", id] })
      setConfirmingId(null)
    },
    onError: () => {
      setConfirmingId(null)
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: "cancelled" | "defaulted") =>
      api.patch<{ loan: ILoan }>(`/loans/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loan", id] })
      setStatusError("")
    },
    onError: (err) => {
      setStatusError(err instanceof Error ? err.message : "Gagal mengubah status")
    },
  })

  const handleConfirm = (installmentId: string) => {
    setConfirmingId(installmentId)
    confirmMutation.mutate(installmentId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data?.loan) {
    return (
      <div className="px-4 pt-4">
        <p className="text-gray-400 text-center">Pinjaman tidak ditemukan</p>
        <Link to="/pinjaman" className="text-[var(--color-primary)] text-sm mt-2 block text-center">Kembali</Link>
      </div>
    )
  }

  const { loan, installments, borrower } = data
  const paidCount = installments.filter((i) => i.status === "paid").length
  const totalPaid = installments.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0)
  const progress = installments.length > 0 ? Math.round((paidCount / installments.length) * 100) : 0
  const completionMessage = completionData?.message ?? null
  const allPaid = installments.length > 0 && paidCount === installments.length

  return (
    <div className="px-4 pt-2 pb-6">
      <Link to="/pinjaman" className="inline-flex items-center gap-1 text-sm text-gray-500 mb-4">
        <IconChevronLeft className="w-4 h-4" /> Kembali
      </Link>

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
        {borrower && (
          <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-80">
            <span className="font-medium">Peminjam:</span> {borrower.displayName || borrower.email}
            {borrower.borrowerTier && <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{borrower.borrowerTier}</span>}
          </div>
        )}
      </div>

      {loan.status === "active" && (
        <div className="mb-4">
          {statusError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-3 text-sm">{statusError}</div>}
          <div className="flex gap-2">
            <button
              onClick={() => { if (confirm("Batalkan pinjaman ini?")) statusMutation.mutate("cancelled") }}
              disabled={statusMutation.isPending}
              className="flex-1 border border-red-200 text-red-600 rounded-xl py-2 text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              Batalkan
            </button>
            <button
              onClick={() => { if (confirm("Tandai sebagai gagal bayar?")) statusMutation.mutate("defaulted") }}
              disabled={statusMutation.isPending || paidCount > 0}
              className="flex-1 border border-yellow-200 text-yellow-700 rounded-xl py-2 text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
              title={paidCount > 0 ? "Tidak bisa tandai gagal bayar jika sudah ada cicilan lunas" : ""}
            >
              Gagal Bayar
            </button>
          </div>
          {paidCount > 0 && (
            <p className="text-xs text-gray-400 mt-1 text-center">Gagal bayar hanya tersedia jika belum ada cicilan lunas</p>
          )}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-900">Progress Cicilan</p>
          <p className="text-sm text-gray-500">{paidCount}/{installments.length} · {progress}%</p>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-primary)] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Terbayar: {formatCurrency(totalPaid)}</span>
          <span>Sisa: {formatCurrency(loan.amount - totalPaid)}</span>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 mb-3">Riwayat Cicilan</h3>
      {installments.length === 0 ? (
        <p className="text-gray-400 text-sm">Belum ada cicilan</p>
      ) : (
        <div className="space-y-2">
          {installments.map((inst) => (
            <div key={inst.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
              {inst.status === "paid" ? (
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <IconCheck className="w-4 h-4 text-green-600" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <IconClock className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{inst.periodLabel}</p>
                <p className="text-xs text-gray-400">{formatDate(inst.dueDate)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-gray-900 text-sm">{formatCurrency(inst.amount)}</p>
                {inst.status === "paid" ? (
                  <p className="text-xs text-green-600">Lunas</p>
                ) : inst.status === "processing" ? (
                  <p className="text-xs text-yellow-600">Diproses</p>
                ) : (
                  <button
                    onClick={() => handleConfirm(inst.id)}
                    disabled={confirmingId === inst.id}
                    className="text-xs text-[var(--color-primary)] font-medium hover:underline disabled:opacity-50"
                  >
                    {confirmingId === inst.id ? "Menyimpan..." : "Tandai Lunas"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {loan.doaLunasEnabled && allPaid && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Doa Lunas</h3>
          {completionMessage ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-sm text-green-800 italic">"{completionMessage.message}"</p>
              <p className="text-xs text-green-600 mt-2">{formatDate(completionMessage.createdAt)}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Menunggu doa lunas dari peminjam.</p>
          )}
        </div>
      )}

      {loan.doaLunasEnabled && !allPaid && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Doa Lunas</h3>
          {completionMessage ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-sm text-green-800 italic">"{completionMessage.message}"</p>
              <p className="text-xs text-green-600 mt-2">{formatDate(completionMessage.createdAt)}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Doa lunas bisa ditulis setelah semua cicilan lunas.</p>
          )}
        </div>
      )}
    </div>
  )
}