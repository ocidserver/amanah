import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { LOAN_STATUS, COLLATERAL_TYPE, LOAN_PURPOSE, INSTALLMENT_STATUS, BORROWER_TIER_LABELS } from "@amanah/shared"
import { IconChevronLeft, IconCheck, IconClock, IconXCircle, IconDownload, IconFileText, IconXCircle as IconClose } from "../components/Icons"
import DocumentViewer from "../components/DocumentViewer"

interface AdminLoanDetail {
  id: string
  borrowerAlias: string
  borrowerId: string | null
  amount: number
  durationMonths: number
  purpose: string
  collateralType: string
  collateralDescription: string | null
  collateralStatus: string
  status: string
  ujrah: number
  stampFee: number
  adminFee: number
  custodyFee: number
  totalFee: number
  disbursedAmount: number
  contractUrl: string | null
  startDate: string | null
  dueDate: string | null
  createdAt: string
  lender: {
    id: string
    email: string
    displayName: string | null
  } | null
  trustee: {
    id: string
    name: string
    institution: string | null
    isVerified: boolean
  } | null
}

interface BorrowerInfo {
  id: string
  email: string
  displayName: string | null
  phone: string | null
  idNumber: string | null
  address: string | null
  occupation: string | null
  borrowerTier: string | null
  isVerified: boolean
}

interface Installment {
  id: string
  periodLabel: string
  amount: number
  dueDate: string
  paidAt: string | null
  status: string
  confirmedBy: string | null
  reminderSentAt: string | null
  createdAt: string
}

export default function AdminLoanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-loan-detail", id],
    queryFn: () => api.get<{ loan: AdminLoanDetail; installments: Installment[]; borrower: BorrowerInfo | null }>(`/admin/loans/${id}`),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data?.loan) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-slate-400">Pinjaman tidak ditemukan</p>
        <button onClick={() => navigate("/admin/loans")} className="mt-4 text-[var(--color-primary)] hover:underline">
          Kembali ke daftar pinjaman
        </button>
      </div>
    )
  }

  const { loan, installments, borrower } = data
  const paidCount = installments.filter((i) => i.status === "paid").length
  const totalCount = installments.length
  const progressPercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/loans")} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
            <IconChevronLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Detail Pinjaman</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">{loan.borrowerAlias}</p>
          </div>
        </div>
        {loan.contractUrl && (
          <DocumentViewer url={loan.contractUrl} label="Lihat Kontrak" variant="pdf" />
        )}
      </div>

      {/* Status + Progress */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Status</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
            loan.status === "active" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
            loan.status === "pending" ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
            loan.status === "completed" ? "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400" :
            loan.status === "defaulted" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
            "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
          }`}>
            {LOAN_STATUS[loan.status as keyof typeof LOAN_STATUS] || loan.status}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Progress Pembayaran</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-3">
              <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{progressPercent}%</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{paidCount} dari {totalCount} cicilan lunas</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Nominal</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(loan.amount)}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{loan.durationMonths} bulan</p>
        </div>
      </div>

      {/* Installments Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Cicilan</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700">
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Periode</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Jumlah</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Jatuh Tempo</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Tanggal Bayar</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {installments.map((inst) => (
              <tr key={inst.id} className={inst.status === "paid" ? "bg-green-50/30 dark:bg-green-900/10" : ""}>
                <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{inst.periodLabel}</td>
                <td className="px-5 py-3 text-gray-900 dark:text-gray-100">{formatCurrency(inst.amount)}</td>
                <td className="px-5 py-3 text-gray-600 dark:text-slate-400">{formatDate(inst.dueDate)}</td>
                <td className="px-5 py-3 text-gray-600 dark:text-slate-400">{inst.paidAt ? formatDate(inst.paidAt) : "-"}</td>
                <td className="px-5 py-3">
                  {inst.status === "paid" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                      <IconCheck className="w-3.5 h-3.5" /> Lunas
                    </span>
                  ) : inst.status === "processing" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                      <IconClock className="w-3.5 h-3.5" /> Diproses
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 font-medium">
                      <IconXCircle className="w-3.5 h-3.5" /> Belum Bayar
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-2 gap-5">
        {/* Loan Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Informasi Pinjaman</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-slate-400">Tujuan</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{LOAN_PURPOSE[loan.purpose as keyof typeof LOAN_PURPOSE]}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-slate-400">Jenis Cicilan</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{loan.startDate ? formatDate(loan.startDate) : "-"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-slate-400">Jatuh Tempo</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{loan.dueDate ? formatDate(loan.dueDate) : "-"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-slate-400">Dana Diterima</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(loan.disbursedAmount)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-500 dark:text-slate-400">Total Biaya</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(loan.totalFee)}</span>
            </div>
          </div>
        </div>

        {/* Collateral */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Jaminan</h3>
          {loan.collateralType !== "none" ? (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                <span className="text-sm text-gray-500 dark:text-slate-400">Jenis</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{COLLATERAL_TYPE[loan.collateralType as keyof typeof COLLATERAL_TYPE]}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                <span className="text-sm text-gray-500 dark:text-slate-400">Status</span>
                <span className="text-sm font-medium capitalize">{loan.collateralStatus}</span>
              </div>
              {loan.collateralDescription && (
                <div className="py-2 border-b border-gray-100 dark:border-slate-700">
                  <span className="text-sm text-gray-500 dark:text-slate-400 block mb-1">Deskripsi</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{loan.collateralDescription}</p>
                </div>
              )}
              {loan.trustee && (
                <div className="py-2">
                  <span className="text-sm text-gray-500 dark:text-slate-400 block mb-1">Wali Amanah</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{loan.trustee.name}</p>
                  {loan.trustee.institution && <p className="text-xs text-gray-500 dark:text-slate-400">{loan.trustee.institution}</p>}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400">Tanpa jaminan</p>
          )}
        </div>

        {/* Lender */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Pemberi Pinjaman</h3>
          {loan.lender ? (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                <span className="text-sm text-gray-500 dark:text-slate-400">Nama</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{loan.lender.displayName || "-"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500 dark:text-slate-400">Email</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{loan.lender.email}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400">Belum ada pemberi pinjaman</p>
          )}
        </div>

        {/* Borrower */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Peminjam</h3>
          {borrower ? (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                <span className="text-sm text-gray-500 dark:text-slate-400">Nama</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{borrower.displayName || "-"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                <span className="text-sm text-gray-500 dark:text-slate-400">Email</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{borrower.email}</span>
              </div>
              {borrower.phone && (
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                  <span className="text-sm text-gray-500 dark:text-slate-400">Telepon</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{borrower.phone}</span>
                </div>
              )}
              {borrower.borrowerTier && (
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-500 dark:text-slate-400">Tier</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{BORROWER_TIER_LABELS[borrower.borrowerTier as keyof typeof BORROWER_TIER_LABELS]}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400">-</p>
          )}
        </div>
      </div>
    </div>
  )
}
