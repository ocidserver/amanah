import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { IconChevronLeft, IconClock, IconCheck, IconCheckCircle, IconXCircle, IconBell, IconMessageCircle, IconDownload } from "../components/Icons"
import { LOAN_PURPOSE, LOAN_STATUS } from "@amanah/shared"
import type { ILoan, IInstallment, ICompletionMessage, IPaymentProof } from "@amanah/shared"

export default function PinjamanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState("")
  const [verifyingProofId, setVerifyingProofId] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["loan", id],
    queryFn: () => api.get<{ loan: ILoan; installments: IInstallment[]; borrower: { id: string; displayName: string | null; email: string; borrowerTier: string | null } | null }>(`/loans/${id}`),
  })

  const { data: completionData } = useQuery({
    queryKey: ["completion-messages", id],
    queryFn: () => api.get<{ message: ICompletionMessage | null }>(`/completion-messages/loan/${id}`),
    enabled: !!id,
  })

  // Fetch payment proofs for all installments
  const { data: proofsMap } = useQuery({
    queryKey: ["payment-proofs", id],
    queryFn: async () => {
      if (!data?.installments) return {}
      const proofs: Record<string, IPaymentProof | null> = {}
      await Promise.all(
        data.installments.map(async (inst) => {
          try {
            const res = await api.get<{ proof: IPaymentProof | null }>(`/payment-proofs/installments/${inst.id}`)
            proofs[inst.id] = res.proof
          } catch {
            proofs[inst.id] = null
          }
        })
      )
      return proofs
    },
    enabled: !!data?.installments,
  })

  const confirmMutation = useMutation({
    mutationFn: (installmentId: string) =>
      api.patch<{ installment: IInstallment }>(`/installments/${installmentId}/confirm`, {
        status: "paid",
        confirmedBy: "lender",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loan", id] })
      queryClient.invalidateQueries({ queryKey: ["payment-proofs", id] })
      setConfirmingId(null)
    },
    onError: () => {
      setConfirmingId(null)
    },
  })

  const verifyProofMutation = useMutation({
    mutationFn: ({ proofId, status }: { proofId: string; status: "verified" | "rejected" }) =>
      api.patch<{ proof: IPaymentProof }>(`/payment-proofs/${proofId}/verify`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loan", id] })
      queryClient.invalidateQueries({ queryKey: ["payment-proofs", id] })
      setVerifyingProofId(null)
    },
    onError: () => {
      setVerifyingProofId(null)
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

  const settingsMutation = useMutation({
    mutationFn: (data: { reminderEnabled?: boolean; doaLunasEnabled?: boolean }) =>
      api.patch<{ loan: ILoan }>(`/loans/${id}/settings`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loan", id] })
      setSettingsError("")
    },
    onError: (err) => {
      setSettingsError(err instanceof Error ? err.message : "Gagal mengubah pengaturan")
    },
  })

  const toggleSetting = (key: "reminderEnabled" | "doaLunasEnabled") => {
    settingsMutation.mutate({ [key]: !loan[key] })
  }

  const handleConfirm = (installmentId: string) => {
    setConfirmingId(installmentId)
    confirmMutation.mutate(installmentId)
  }

  const handleVerifyProof = (proofId: string, status: "verified" | "rejected") => {
    setVerifyingProofId(proofId)
    verifyProofMutation.mutate({ proofId, status })
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
      <Link to="/pinjaman" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 mb-4">
        <IconChevronLeft className="w-4 h-4" /> Kembali
      </Link>

      <div className="bg-[var(--color-primary)] dark:bg-slate-700 text-white rounded-2xl p-5 mb-4">
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

      {/* Contract Download */}
      {loan.contractUrl && (
        <a
          href={loan.contractUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-white dark:bg-slate-800 dark:border-slate-700 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 mb-4 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-[0.98] transition-transform"
        >
          <IconDownload className="w-4 h-4" /> Unduh Kontrak Pinjaman
        </a>
      )}

      {/* Collateral Proof */}
      {loan.collateralType !== "none" && loan.collateralProofUrl && (
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-2xl border border-gray-100 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">Bukti Jaminan</h3>
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-2 border border-gray-200 dark:border-slate-600">
            <img src={loan.collateralProofUrl} alt="Bukti Jaminan" className="w-full h-48 object-contain rounded" />
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
            Status: <span className="font-medium capitalize">{loan.collateralStatus}</span>
          </p>
        </div>
      )}

      {/* Loan Settings */}
      {loan.status === "active" && (
        <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-2xl border border-gray-100 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">Pengaturan Pinjaman</h3>
          {settingsError && <div className="bg-red-50 dark:bg-red-900/20 dark:border-red-900/30 border border-red-200 text-red-700 dark:text-red-400 rounded-xl px-3 py-2 mb-3 text-xs">{settingsError}</div>}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconBell className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Pengingat Pembayaran</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Notifikasi H-3 dan H-0 jatuh tempo</p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting("reminderEnabled")}
                disabled={settingsMutation.isPending}
                className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                  loan.reminderEnabled ? "bg-[var(--color-primary)]" : "bg-gray-300 dark:bg-slate-600"
                }`}
                role="switch"
                aria-checked={loan.reminderEnabled}
                aria-label="Toggle pengingat pembayaran"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    loan.reminderEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconMessageCircle className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Doa Lunas</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Peminjam bisa kirim pesan syukur</p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting("doaLunasEnabled")}
                disabled={settingsMutation.isPending}
                className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                  loan.doaLunasEnabled ? "bg-[var(--color-primary)]" : "bg-gray-300 dark:bg-slate-600"
                }`}
                role="switch"
                aria-checked={loan.doaLunasEnabled}
                aria-label="Toggle doa lunas"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    loan.doaLunasEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {loan.status === "active" && (
        <div className="mb-4">
          {statusError && <div className="bg-red-50 dark:bg-red-900/20 dark:border-red-900/30 border border-red-200 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-3 text-sm">{statusError}</div>}
          <div className="flex gap-2">
            <button
              onClick={() => { if (confirm("Batalkan pinjaman ini?")) statusMutation.mutate("cancelled") }}
              disabled={statusMutation.isPending}
              className="flex-1 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl py-2 text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              Batalkan
            </button>
            <button
              onClick={() => { if (confirm("Tandai sebagai gagal bayar?")) statusMutation.mutate("defaulted") }}
              disabled={statusMutation.isPending || paidCount > 0}
              className="flex-1 border border-yellow-200 dark:border-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-xl py-2 text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
              title={paidCount > 0 ? "Tidak bisa tandai gagal bayar jika sudah ada cicilan lunas" : ""}
            >
              Gagal Bayar
            </button>
          </div>
          {paidCount > 0 && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 text-center">Gagal bayar hanya tersedia jika belum ada cicilan lunas</p>
          )}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Progress Cicilan</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">{paidCount}/{installments.length} · {progress}%</p>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-primary)] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-slate-400">
          <span>Terbayar: {formatCurrency(totalPaid)}</span>
          <span>Sisa: {formatCurrency(loan.amount - totalPaid)}</span>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Riwayat Cicilan</h3>
      {installments.length === 0 ? (
        <p className="text-gray-400 dark:text-slate-500 text-sm">Belum ada cicilan</p>
      ) : (
        <div className="space-y-2">
          {installments.map((inst) => {
            const proof = proofsMap?.[inst.id]
            const isVerifying = verifyingProofId === proof?.id

            return (
              <div key={inst.id} className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  {inst.status === "paid" ? (
                    <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                      <IconCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      <IconClock className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{inst.periodLabel}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{formatDate(inst.dueDate)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{formatCurrency(inst.amount)}</p>
                    {inst.status === "paid" ? (
                      <p className="text-xs text-green-600 dark:text-green-400">Lunas</p>
                    ) : proof?.status === "verified" ? (
                      <p className="text-xs text-green-600 dark:text-green-400">Terverifikasi</p>
                    ) : proof?.status === "rejected" ? (
                      <p className="text-xs text-red-600 dark:text-red-400">Ditolak</p>
                    ) : proof?.status === "pending" ? (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">Menunggu Verifikasi</p>
                    ) : inst.status === "processing" ? (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">Diproses</p>
                    ) : (
                      <button
                        onClick={() => handleConfirm(inst.id)}
                        disabled={confirmingId === inst.id}
                        className="text-xs text-[var(--color-primary)] dark:text-[var(--color-primary-light)] font-medium hover:underline disabled:opacity-50"
                      >
                        {confirmingId === inst.id ? "Menyimpan..." : "Tandai Lunas"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Proof Section */}
                {proof && proof.status === "pending" && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Bukti Transfer:</span>
                      <span className="text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded">Pending</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-2 mb-3 flex items-center justify-center h-32 border border-gray-200 dark:border-slate-600">
                      <img src={proof.imageUrl} alt="Bukti Transfer" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerifyProof(proof.id, "verified")}
                        disabled={isVerifying}
                        className="flex-1 bg-green-600 text-white rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-1 hover:bg-green-700 disabled:opacity-50"
                      >
                        {isVerifying ? "..." : <><IconCheckCircle className="w-4 h-4" /> Verifikasi</>}
                      </button>
                      <button
                        onClick={() => handleVerifyProof(proof.id, "rejected")}
                        disabled={isVerifying}
                        className="flex-1 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      >
                        {isVerifying ? "..." : <><IconXCircle className="w-4 h-4" /> Tolak</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {loan.doaLunasEnabled && allPaid && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Doa Lunas</h3>
          {completionMessage ? (
            <div className="bg-green-50 dark:bg-green-900/20 dark:border-green-900/30 border border-green-100 rounded-xl p-4">
              <p className="text-sm text-green-800 dark:text-green-300 italic">"{completionMessage.message}"</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">{formatDate(completionMessage.createdAt)}</p>
            </div>
          ) : (
            <p className="text-gray-400 dark:text-slate-500 text-sm">Menunggu doa lunas dari peminjam.</p>
          )}
        </div>
      )}

      {loan.doaLunasEnabled && !allPaid && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Doa Lunas</h3>
          {completionMessage ? (
            <div className="bg-green-50 dark:bg-green-900/20 dark:border-green-900/30 border border-green-100 rounded-xl p-4">
              <p className="text-sm text-green-800 dark:text-green-300 italic">"{completionMessage.message}"</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">{formatDate(completionMessage.createdAt)}</p>
            </div>
          ) : (
            <p className="text-gray-400 dark:text-slate-500 text-sm">Doa lunas bisa ditulis setelah semua cicilan lunas.</p>
          )}
        </div>
      )}
    </div>
  )
}
