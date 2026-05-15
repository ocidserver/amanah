import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { LOAN_PURPOSE, COLLATERAL_TYPE, INSTALLMENT_TYPE, BORROWER_TIER_LABELS } from "@amanah/shared"
import type { ILoan, BorrowerTier } from "@amanah/shared"
import { IconChevronLeft, IconCheck } from "../components/Icons"

interface BorrowerInfo {
  id: string
  displayName: string | null
  email: string
  borrowerTier: string | null
  onTimePercentage: string | null
  completedLoans: number
  phone: string | null
  occupation: string | null
  address: string | null
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [rejectReason, setRejectReason] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["application", id],
    queryFn: () => api.get<{ loan: ILoan; borrower: BorrowerInfo | null }>(`/lender-app/applications/${id}`),
  })

  const approveMutation = useMutation({
    mutationFn: () => api.patch<{ loan: ILoan }>(`/lender-app/applications/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", id] })
      queryClient.invalidateQueries({ queryKey: ["lender-applications"] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => api.patch<{ loan: ILoan }>(`/lender-app/applications/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", id] })
      queryClient.invalidateQueries({ queryKey: ["lender-applications"] })
    },
  })

  const activateMutation = useMutation({
    mutationFn: () => api.patch<{ loan: ILoan }>(`/lender-app/applications/${id}/activate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", id] })
      queryClient.invalidateQueries({ queryKey: ["lender-applications"] })
    },
  })

  if (isLoading || !data) {
    return (
      <div className="px-4 pt-4 pb-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-40" />
          <div className="h-48 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  const loan = data.loan
  const borrower = data.borrower

  if (!loan) {
    return (
      <div className="px-4 pt-4 pb-4 text-center text-gray-500">
        <p>Pengajuan tidak ditemukan</p>
      </div>
    )
  }

  const status = loan.status
  const isPending = status === "pending"
  const isApproved = status === "approved"
  const isRejected = status === "rejected"

  const tierLabel = borrower?.borrowerTier ? BORROWER_TIER_LABELS[borrower.borrowerTier as BorrowerTier] : "Peminjam Baru"

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1">
          <IconChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Detail Pengajuan</h1>
      </div>

      <div className="space-y-4">
        <div className={`rounded-2xl p-4 text-center ${
          isPending ? "bg-amber-50 border border-amber-200" :
          isApproved ? "bg-green-50 border border-green-200" :
          isRejected ? "bg-red-50 border border-red-200" :
          "bg-gray-50 border border-gray-200"
        }`}>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            isPending ? "bg-amber-100 text-amber-700" :
            isApproved ? "bg-green-100 text-green-700" :
            isRejected ? "bg-red-100 text-red-700" :
            "bg-gray-100 text-gray-700"
          }`}>
            {isPending ? "Menunggu Persetujuan" : isApproved ? "Disetujui" : isRejected ? "Ditolak" : status}
          </span>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(loan.amount)}</p>
          <p className="text-sm text-gray-500">{loan.durationMonths} bulan — {LOAN_PURPOSE[loan.purpose]}</p>
        </div>

        {borrower && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Profil Peminjam</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama</span>
                <span className="font-medium">{borrower.displayName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{borrower.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tier</span>
                <span className="font-medium">{tierLabel}</span>
              </div>
              {borrower.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Telepon</span>
                  <span className="font-medium">{borrower.phone}</span>
                </div>
              )}
              {borrower.occupation && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Pekerjaan</span>
                  <span className="font-medium">{borrower.occupation}</span>
                </div>
              )}
              {borrower.onTimePercentage && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Ketepatan Waktu</span>
                  <span className="font-medium">{borrower.onTimePercentage}%</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Pinjaman Selesai</span>
                <span className="font-medium">{borrower.completedLoans}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Detail Pinjaman</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Jenis Cicilan</span>
              <span className="font-medium">{INSTALLMENT_TYPE[loan.installmentType]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Jenis Jaminan</span>
              <span className="font-medium">{COLLATERAL_TYPE[loan.collateralType]}</span>
            </div>
            {loan.collateralDescription && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <span className="text-gray-500 block mb-1">Deskripsi Jaminan</span>
                <p className="text-gray-800">{loan.collateralDescription}</p>
              </div>
            )}
            {loan.applicationNote && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <span className="text-gray-500 block mb-1">Catatan Peminjam</span>
                <p className="text-gray-800">{loan.applicationNote}</p>
              </div>
            )}
          </div>
        </div>

        {(loan.ujrah) > 0 && (
          <div className="bg-green-50 rounded-2xl border border-green-200 p-4">
            <h3 className="font-semibold text-green-900 mb-2">Rincian Biaya</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-green-700">Ujrah</span><span>{formatCurrency(loan.ujrah)}</span></div>
              <div className="flex justify-between"><span className="text-green-700">Materai</span><span>{formatCurrency(loan.stampFee)}</span></div>
              <div className="flex justify-between"><span className="text-green-700">Administrasi</span><span>{formatCurrency(loan.adminFee)}</span></div>
              <div className="flex justify-between"><span className="text-green-700">Penitipan Jaminan</span><span>{formatCurrency(loan.custodyFee)}</span></div>
              <div className="flex justify-between font-bold border-t border-green-200 pt-1 mt-1"><span className="text-green-900">Total Biaya</span><span>{formatCurrency(loan.totalFee)}</span></div>
              <div className="flex justify-between font-bold text-green-800"><span>Dana diterima Peminjam</span><span>{formatCurrency(loan.disbursedAmount)}</span></div>
            </div>
          </div>
        )}

        {isPending && (
          <div className="space-y-3">
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <IconCheck className="w-5 h-5" />
              {approveMutation.isPending ? "Menyetujui..." : "Setujui Pinjaman"}
            </button>
            {(approveMutation.isSuccess) && (
              <p className="text-green-600 text-sm text-center">Pinjaman berhasil disetujui!</p>
            )}

            <div className="border-t border-gray-100 pt-3">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Alasan penolakan (opsional)"
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 resize-none text-sm"
              />
              <button
                onClick={() => rejectMutation.mutate(rejectReason)}
                disabled={rejectMutation.isPending}
                className="w-full mt-2 bg-red-50 text-red-700 py-3 rounded-xl font-semibold hover:bg-red-100 disabled:opacity-50"
              >
                {rejectMutation.isPending ? "Menolak..." : "Tolak Pengajuan"}
              </button>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="space-y-3">
            <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-200">
              <IconCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-semibold">Pengajuan Disetujui</p>
              <p className="text-green-700 text-sm mt-1">Menunggu verifikasi jaminan oleh wali amanah.</p>
            </div>
            <button
              onClick={() => {
                if (confirm("Aktifkan pinjaman ini? Pastikan jaminan sudah diverifikasi oleh wali amanah.")) {
                  activateMutation.mutate()
                }
              }}
              disabled={activateMutation.isPending}
              className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <IconCheck className="w-5 h-5" />
              {activateMutation.isPending ? "Mengaktifkan..." : "Aktifkan Pinjaman"}
            </button>
            {activateMutation.isSuccess && (
              <p className="text-green-600 text-sm text-center">Pinjaman berhasil diaktifkan!</p>
            )}
          </div>
        )}

        {isRejected && (
          <div className="bg-red-50 rounded-2xl p-4 text-center">
            <p className="text-red-800 font-semibold">Pengajuan Ditolak</p>
            {loan.notesEncrypted && <p className="text-red-700 text-sm mt-1">{loan.notesEncrypted}</p>}
          </div>
        )}
      </div>
    </div>
  )
}