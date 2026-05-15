import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useRef } from "react"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { IconChevronLeft, IconClock, IconCheck, IconUpload } from "../components/Icons"
import { LOAN_PURPOSE, LOAN_STATUS } from "@amanah/shared"
import type { ILoan, IInstallment, ICompletionMessage } from "@amanah/shared"

export default function BorrowerLoanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [doaMessage, setDoaMessage] = useState("")
  const [doaSubmitting, setDoaSubmitting] = useState(false)
  const [doaError, setDoaError] = useState("")
  
  // Upload state
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["borrower-loan", id],
    queryFn: () => api.get<{
      loan: ILoan
      installments: IInstallment[]
      lender: { id: string; displayName: string | null; lenderTier: string | null; rating: string | null } | null
      completionMessage: ICompletionMessage | null
      lenderRating: { id: string; rating: number; review: string | null } | null
    }>(`/borrower/loans/${id}`),
  })

  const uploadProofMutation = useMutation({
    mutationFn: async ({ installmentId, file }: { installmentId: string; file: File }) => {
      const formData = new FormData()
      formData.append("image", file)
      
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/payment-proofs/installments/${installmentId}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Gagal mengupload bukti")
      }
      
      return response.json()
    },
    onMutate: () => {
      setUploadProgress(0)
      setUploadError(null)
      // Simulate progress since fetch doesn't support upload progress events easily
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 200)
      return { interval }
    },
    onSuccess: (_, { installmentId }) => {
      setUploadProgress(100)
      setTimeout(() => {
        setUploadingId(null)
        setSelectedInstallmentId(null)
        queryClient.invalidateQueries({ queryKey: ["borrower-loan", id] })
      }, 500)
    },
    onError: (err) => {
      setUploadError(err instanceof Error ? err.message : "Terjadi kesalahan")
      setUploadingId(null)
      setUploadProgress(0)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && selectedInstallmentId) {
      setUploadingId(selectedInstallmentId)
      uploadProofMutation.mutate({ installmentId: selectedInstallmentId, file })
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const openFilePicker = (installmentId: string) => {
    setSelectedInstallmentId(installmentId)
    fileInputRef.current?.click()
  }

  const handleDoaLunas = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data?.loan || !doaMessage.trim()) return
    setDoaSubmitting(true)
    setDoaError("")
    try {
      await api.post(`/borrower/completion-messages/loan/${data.loan.id}`, { message: doaMessage.trim() })
      setDoaMessage("")
      queryClient.invalidateQueries({ queryKey: ["borrower-loan", id] })
    } catch (err) {
      setDoaError(err instanceof Error ? err.message : "Gagal mengirim doa lunas")
    } finally {
      setDoaSubmitting(false)
    }
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
        <Link to="/borrower" className="text-[var(--color-primary)] text-sm mt-2 block text-center">Kembali</Link>
      </div>
    )
  }

  const { loan, installments, lender, completionMessage, lenderRating } = data
  const paidCount = installments.filter((i) => i.status === "paid").length
  const totalPaid = installments.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0)
  const progress = installments.length > 0 ? Math.round((paidCount / installments.length) * 100) : 0
  const allPaid = installments.length > 0 && paidCount === installments.length

  return (
    <div className="px-4 pt-2 pb-6">
      <Link to="/borrower" className="inline-flex items-center gap-1 text-sm text-gray-500 mb-4">
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
        {lender && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs opacity-70">Pemberi Pinjaman</p>
            <p className="font-medium">{lender.displayName || "Tanpa Nama"}</p>
            {lender.rating && <p className="text-xs opacity-70">Rating: {Number(lender.rating).toFixed(1)}/5</p>}
          </div>
        )}
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

      <h3 className="font-semibold text-gray-900 mb-3">Jadwal Cicilan</h3>
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
              <div className="text-right shrink-0 min-w-[100px]">
                <p className="font-semibold text-gray-900 text-sm">{formatCurrency(inst.amount)}</p>
                {inst.status === "paid" ? (
                  <p className="text-xs text-green-600">Lunas</p>
                ) : uploadingId === inst.id ? (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-[var(--color-primary)] h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Mengupload...</p>
                  </div>
                ) : uploadError && uploadingId === inst.id ? (
                   <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                ) : (
                  <button
                    onClick={() => openFilePicker(inst.id)}
                    className="text-xs text-[var(--color-primary)] font-medium hover:underline flex items-center justify-center gap-1 w-full mt-1"
                  >
                    <IconUpload className="w-3 h-3" /> Upload Bukti
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
      />

      {loan.doaLunasEnabled && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Doa Lunas</h3>
          {completionMessage ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-sm text-green-800 italic">"{completionMessage.message}"</p>
              <p className="text-xs text-green-600 mt-2">{formatDate(completionMessage.createdAt)}</p>
            </div>
          ) : allPaid ? (
            <form onSubmit={handleDoaLunas} className="space-y-3">
              <textarea
                value={doaMessage}
                onChange={(e) => setDoaMessage(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none"
                rows={3}
                placeholder="Tulis doa atau pesan syukur untuk pemberi pinjaman..."
                maxLength={500}
              />
              {doaError && <p className="text-red-600 text-xs">{doaError}</p>}
              <button
                type="submit"
                disabled={doaSubmitting || !doaMessage.trim()}
                className="w-full bg-[var(--color-primary)] text-white rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                {doaSubmitting ? "Mengirim..." : "Kirim Doa Lunas"}
              </button>
            </form>
          ) : (
            <p className="text-gray-400 text-sm">Kirim doa lunas setelah semua cicilan terbayar.</p>
          )}
        </div>
      )}

      {allPaid && !lenderRating && loan.status === "completed" && loan.lenderId && (
        <div className="mt-6">
          <RateLenderForm loanId={loan.id} lenderId={loan.lenderId} onSubmitted={() => {
            queryClient.invalidateQueries({ queryKey: ["borrower-loan", id] })
          }} />
        </div>
      )}
    </div>
  )
}

function RateLenderForm({ loanId, lenderId, onSubmitted }: { loanId: string; lenderId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
        <p className="text-green-800 font-semibold">Terima kasih!</p>
        <p className="text-green-600 text-sm mt-1">Rating Anda telah terkirim.</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return
    setSubmitting(true)
    setError("")
    try {
      await api.post("/borrower/rate-lender", { loanId, rating, review: review.trim() || undefined })
      setSubmitted(true)
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim rating")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">Beri Rating Pemberi Pinjaman</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-3xl transition-colors"
            >
              {star <= (hoverRating || rating) ? "★" : "☆"}
            </button>
          ))}
        </div>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none"
          rows={2}
          placeholder="Pesan opsional..."
          maxLength={500}
        />
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full bg-[var(--color-primary)] text-white rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {submitting ? "Mengirim..." : "Kirim Rating"}
        </button>
      </form>
    </div>
  )
}
