import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { IconChevronLeft, IconCheckCircle, IconXCircle, IconEye, IconClock } from "../components/Icons"
import type { IPaymentProof } from "@amanah/shared"

interface ProofWithDetails {
  id: string
  installmentId: string
  imageUrl: string
  status: "pending" | "verified" | "rejected"
  uploadedAt: string
  installment: {
    id: string
    periodLabel: string
    amount: number
    dueDate: string
    status: string
  }
  loan: {
    id: string
    loanCode: string
    borrowerAlias: string
    lenderId: string
  }
}

type FilterTab = "pending" | "verified" | "rejected"

export default function PaymentProofsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<FilterTab>("pending")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["payment-proofs", activeTab],
    queryFn: () => {
      if (activeTab === "pending") {
        return api.get<{ proofs: ProofWithDetails[]; count: number }>("/payment-proofs/pending")
      }
      return api.get<{ proofs: ProofWithDetails[]; count: number }>(`/payment-proofs?status=${activeTab}`)
    },
    refetchInterval: 30000,
  })

  const verifyMutation = useMutation({
    mutationFn: ({ proofId, status }: { proofId: string; status: "verified" | "rejected" }) =>
      api.patch<{ proof: IPaymentProof }>(`/payment-proofs/${proofId}/verify`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-proofs"] })
      queryClient.invalidateQueries({ queryKey: ["loans"] })
      queryClient.invalidateQueries({ queryKey: ["pending-payment-proofs"] })
      setVerifyingId(null)
    },
    onError: () => {
      setVerifyingId(null)
    },
  })

  const proofs = data?.proofs ?? []
  const pendingCount = data?.count ?? 0

  const tabs: { key: FilterTab; label: string; color: string }[] = [
    { key: "pending", label: "Menunggu", color: "amber" },
    { key: "verified", label: "Diterima", color: "green" },
    { key: "rejected", label: "Ditolak", color: "red" },
  ]

  return (
    <div className="px-4 pt-2 pb-6">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 mb-4">
        <IconChevronLeft className="w-4 h-4" /> Kembali
      </Link>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Verifikasi Bukti Bayar</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Tinjau bukti transfer dari peminjam</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? tab.color === "amber"
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                  : tab.color === "green"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
            }`}
          >
            {tab.label}
            {tab.key === "pending" && pendingCount > 0 && (
              <span className="ml-1 bg-amber-600 text-white rounded-full px-1.5 py-0.5 text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-gray-200 dark:bg-slate-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : proofs.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center">
            <IconClock className="w-6 h-6 text-gray-300 dark:text-slate-500" />
          </div>
          <p className="text-gray-400 dark:text-slate-400 text-sm">
            {activeTab === "pending"
              ? "Tidak ada bukti bayar menunggu verifikasi"
              : activeTab === "verified"
              ? "Belum ada bukti bayar yang diterima"
              : "Belum ada bukti bayar yang ditolak"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {proofs.map((proof) => (
            <ProofCard
              key={proof.id}
              proof={proof}
              onPreview={() => setPreviewUrl(proof.imageUrl)}
              onVerify={(status) => {
                setVerifyingId(proof.id)
                verifyMutation.mutate({ proofId: proof.id, status })
              }}
              isVerifying={verifyingId === proof.id}
            />
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={previewUrl}
              alt="Bukti Transfer"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProofCard({
  proof,
  onPreview,
  onVerify,
  isVerifying,
}: {
  proof: ProofWithDetails
  onPreview: () => void
  onVerify: (status: "verified" | "rejected") => void
  isVerifying: boolean
}) {
  const statusBadge =
    proof.status === "pending" ? (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">Menunggu</span>
    ) : proof.status === "verified" ? (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">Diterima</span>
    ) : (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium">Ditolak</span>
    )

  return (
    <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <button
          onClick={onPreview}
          className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 group"
        >
          <img src={proof.imageUrl} alt="Bukti" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <IconEye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          </div>
        </button>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {statusBadge}
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{proof.loan.borrowerAlias}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">{proof.installment.periodLabel}</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">{formatCurrency(proof.installment.amount)}</p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Upload: {formatDate(proof.uploadedAt)}</p>
          <Link
            to={`/pinjaman/${proof.loan.id}`}
            className="text-[10px] text-[var(--color-primary)] dark:text-[var(--color-primary-light)] font-medium mt-1 inline-block hover:underline"
          >
            Lihat Pinjaman →
          </Link>
        </div>
      </div>

      {/* Action Buttons */}
      {proof.status === "pending" && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={() => onVerify("verified")}
            disabled={isVerifying}
            className="flex-1 bg-green-600 text-white rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-1 hover:bg-green-700 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {isVerifying ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <IconCheckCircle className="w-4 h-4" /> Terima
              </>
            )}
          </button>
          <button
            onClick={() => onVerify("rejected")}
            disabled={isVerifying}
            className="flex-1 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {isVerifying ? (
              <div className="w-4 h-4 border-2 border-red-200 dark:border-red-900/30 border-t-red-600 dark:border-t-red-400 rounded-full animate-spin" />
            ) : (
              <>
                <IconXCircle className="w-4 h-4" /> Tolak
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
