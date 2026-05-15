import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { IconChevronLeft, IconClock, IconCheck } from "../components/Icons"
import type { ILoan, IInstallment, ICompletionMessage } from "@amanah/shared"

export default function PinjamanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["loan", id],
    queryFn: () => api.get<{ loan: ILoan; installments: IInstallment[] }>(`/loans/${id}`),
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

  const { loan, installments } = data
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
            {loan.purpose === "business_capital" ? "Modal Usaha" : loan.purpose === "home_repair" ? "Renovasi" : loan.purpose === "education" ? "Pendidikan" : loan.purpose === "health" ? "Kesehatan" : loan.purpose === "urgent_needs" ? "Mendesak" : loan.purpose === "worship" ? "Ibadah" : "Konsumatif"}
          </span>
          <span className="text-sm font-medium bg-white/20 px-2.5 py-0.5 rounded-full">
            {loan.status === "active" ? "Aktif" : loan.status === "completed" ? "Lunas" : loan.status}
          </span>
        </div>
        <p className="text-2xl font-bold">{formatCurrency(loan.amount)}</p>
        <p className="text-sm opacity-70 mt-1">{loan.borrower_alias} · {loan.duration_months} bulan</p>
      </div>

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
                <p className="font-medium text-gray-900 text-sm">{inst.period_label}</p>
                <p className="text-xs text-gray-400">{formatDate(inst.due_date)}</p>
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

      {loan.doa_lunas_enabled && allPaid && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Doa Lunas</h3>
          {completionMessage ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-sm text-green-800 italic">"{completionMessage.message}"</p>
              <p className="text-xs text-green-600 mt-2">{formatDate(completionMessage.created_at)}</p>
            </div>
          ) : (
            <DoaLunasForm loanId={loan.id} onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["completion-messages", id] })
            }} />
          )}
        </div>
      )}

      {loan.doa_lunas_enabled && !allPaid && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Doa Lunas</h3>
          {completionMessage ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-sm text-green-800 italic">"{completionMessage.message}"</p>
              <p className="text-xs text-green-600 mt-2">{formatDate(completionMessage.created_at)}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Doa lunas bisa ditulis setelah semua cicilan lunas.</p>
          )}
        </div>
      )}
    </div>
  )
}

function DoaLunasForm({ loanId, onSuccess }: { loanId: string; onSuccess: () => void }) {
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError("")
    try {
      await api.post("/completion-messages/loan/" + loanId, { message: message.trim() })
      setMessage("")
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim doa lunas")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none"
        rows={3}
        placeholder="Tulis doa atau pesan syukur..."
        maxLength={500}
      />
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !message.trim()}
        className="w-full bg-[var(--color-primary)] text-white rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
      >
        {submitting ? "Mengirim..." : "Kirim Doa Lunas"}
      </button>
    </form>
  )
}