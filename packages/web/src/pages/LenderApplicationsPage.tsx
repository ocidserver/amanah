import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { LOAN_PURPOSE, BORROWER_TIER_LABELS } from "@amanah/shared"
import type { ILoan, BorrowerTier } from "@amanah/shared"
import { IconChevronRight, IconWallet, IconClock } from "../components/Icons"

interface BorrowerInfo {
  id: string
  displayName: string | null
  email: string
  borrowerTier: string | null
  onTimePercentage: string | null
  completedLoans: number
}

interface ApplicationItem extends ILoan {
  borrower: BorrowerInfo | null
}

export default function LenderApplicationsPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ["lender-applications"],
    queryFn: () => api.get<{ applications: ApplicationItem[]; myApprovedLoans: ILoan[] }>("/lender-app/applications"),
  })

  const applications = data?.applications ?? []
  const myApprovedLoans = data?.myApprovedLoans ?? []

  const pendingApplications = applications
  const approvedLoans = myApprovedLoans.filter((l) => l.status === "approved")
  const activeLoans = myApprovedLoans.filter((l) => l.status === "active")

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1">
          <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Pengajuan Pinjaman</h1>
      </div>

      {pendingApplications.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Menunggu Persetujuan</h2>
          <div className="space-y-3">
            {pendingApplications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        </div>
      )}

      {approvedLoans.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Disetujui — Menunggu Aktivasi</h2>
          <div className="space-y-3">
            {approvedLoans.map((loan) => (
              <div key={loan.id} className="bg-white rounded-2xl border border-blue-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">Disetujui</span>
                    <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(loan.amount)}</p>
                    <p className="text-xs text-gray-400">{loan.durationMonths} bulan — {LOAN_PURPOSE[loan.purpose as keyof typeof LOAN_PURPOSE]}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/pinjaman/${loan.id}`)}
                    className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl font-semibold"
                  >
                    Kelola
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-32" />
          ))}
        </div>
      ) : pendingApplications.length === 0 && approvedLoans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center">
            <IconWallet className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">Belum ada pengajuan pinjaman</p>
          <p className="text-gray-400 text-xs mt-1">Pengajuan dari peminjam akan muncul di sini</p>
        </div>
      ) : null}
    </div>
  )
}

function ApplicationCard({ application }: { application: ApplicationItem }) {
  const navigate = useNavigate()

  const borrower = application.borrower
  const tierLabel = borrower?.borrowerTier ? BORROWER_TIER_LABELS[borrower.borrowerTier as BorrowerTier] : "Peminjam Baru"

  return (
    <button
      onClick={() => navigate(`/pengajuan/${application.id}`)}
      className="block w-full text-left bg-white rounded-2xl border border-gray-100 p-4 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">Menunggu</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {LOAN_PURPOSE[application.purpose as keyof typeof LOAN_PURPOSE]}
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(application.amount)}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
            <span>{application.durationMonths} bulan</span>
            <span className="flex items-center gap-0.5">
              <IconClock className="w-3 h-3" />
              {formatDate(application.createdAt)}
            </span>
          </div>
          {borrower && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">{borrower.displayName || borrower.email}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700">{tierLabel}</span>
            </div>
          )}
          {application.totalFee > 0 && (
            <div className="mt-1 text-xs text-gray-400">
              Dana diterima: {formatCurrency(application.disbursedAmount)} | Biaya: {formatCurrency(application.totalFee)}
            </div>
          )}
        </div>
        <IconChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
      </div>
    </button>
  )
}