import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { IconSearch, IconChevronRight, IconEye } from "../components/Icons"
import { LOAN_STATUS, COLLATERAL_TYPE, LOAN_PURPOSE } from "@amanah/shared"

interface AdminLoan {
  id: string
  borrowerAlias: string
  amount: number
  durationMonths: number
  purpose: string
  collateralType: string
  collateralDescription: string | null
  collateralStatus: string
  status: string
  ujrah: number
  totalFee: number
  disbursedAmount: number
  startDate: string | null
  dueDate: string | null
  createdAt: string
  lender: {
    id: string
    email: string
    displayName: string | null
  } | null
}

export default function AdminLoansPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedLoan, setSelectedLoan] = useState<AdminLoan | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-loans", search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      return api.get<{ loans: AdminLoan[] }>(`/admin/loans?${params}`)
    },
  })

  const loans = data?.loans || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pinjaman</h1>
          <p className="text-gray-500 mt-1">Kelola semua pinjaman</p>
        </div>
        <span className="text-sm text-gray-500">{loans.length} pinjaman</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari peminjam..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="active">Aktif</option>
            <option value="completed">Lunas</option>
            <option value="defaulted">Gagal Bayar</option>
            <option value="cancelled">Dibatalkan</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Peminjam</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Nominal</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Durasi</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Jaminan</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Status Jaminan</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Pemberi</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Tanggal</th>
              <th className="text-right px-5 py-3 font-semibold text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-gray-400">Memuat...</td>
              </tr>
            ) : loans.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-gray-400">Tidak ada pinjaman ditemukan</td>
              </tr>
            ) : (
              loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{loan.borrowerAlias}</p>
                    <p className="text-xs text-gray-500">{LOAN_PURPOSE[loan.purpose as keyof typeof LOAN_PURPOSE] || loan.purpose}</p>
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-900">{formatCurrency(loan.amount)}</td>
                  <td className="px-5 py-3 text-gray-600">{loan.durationMonths} bulan</td>
                  <td className="px-5 py-3">
                    {loan.collateralType !== "none" ? (
                      <div>
                        <p className="text-sm text-gray-900">{COLLATERAL_TYPE[loan.collateralType as keyof typeof COLLATERAL_TYPE]}</p>
                        {loan.collateralDescription && (
                          <p className="text-xs text-gray-500 truncate max-w-[200px]" title={loan.collateralDescription}>{loan.collateralDescription}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {loan.collateralType !== "none" ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        loan.collateralStatus === "verified" ? "bg-blue-50 text-blue-700" :
                        loan.collateralStatus === "held" ? "bg-yellow-50 text-yellow-700" :
                        loan.collateralStatus === "returned" ? "bg-green-50 text-green-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {loan.collateralStatus}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      loan.status === "active" ? "bg-green-50 text-green-700" :
                      loan.status === "pending" ? "bg-yellow-50 text-yellow-700" :
                      loan.status === "approved" ? "bg-blue-50 text-blue-700" :
                      loan.status === "completed" ? "bg-gray-100 text-gray-600" :
                      loan.status === "defaulted" ? "bg-red-50 text-red-700" :
                      loan.status === "rejected" ? "bg-red-50 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {LOAN_STATUS[loan.status as keyof typeof LOAN_STATUS] || loan.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{loan.lender?.displayName || "-"}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(loan.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setSelectedLoan(loan)}
                      className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:underline font-medium"
                    >
                      <IconEye className="w-4 h-4" /> Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Loan Detail Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setSelectedLoan(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Detail Pinjaman</h3>
                  <p className="text-sm text-gray-500">{selectedLoan.borrowerAlias}</p>
                </div>
                <button onClick={() => setSelectedLoan(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Peminjam</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedLoan.borrowerAlias}</p>
                </div>
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Tujuan</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{LOAN_PURPOSE[selectedLoan.purpose as keyof typeof LOAN_PURPOSE]}</p>
                </div>
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Nominal</span>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrency(selectedLoan.amount)}</p>
                </div>
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Durasi</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedLoan.durationMonths} bulan</p>
                </div>
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Total Biaya</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{formatCurrency(selectedLoan.totalFee)}</p>
                </div>
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Dana Diterima</span>
                  <p className="text-sm font-medium text-green-600 mt-0.5">{formatCurrency(selectedLoan.disbursedAmount)}</p>
                </div>
                {selectedLoan.collateralType !== "none" && (
                  <>
                    <div className="py-2 border-b border-gray-100">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">Jaminan</span>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{COLLATERAL_TYPE[selectedLoan.collateralType as keyof typeof COLLATERAL_TYPE]}</p>
                    </div>
                    <div className="py-2 border-b border-gray-100">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">Status Jaminan</span>
                      <p className="text-sm font-medium mt-0.5 capitalize">{selectedLoan.collateralStatus}</p>
                    </div>
                    {selectedLoan.collateralDescription && (
                      <div className="py-2 border-b border-gray-100 col-span-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Deskripsi Jaminan</span>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedLoan.collateralDescription}</p>
                      </div>
                    )}
                  </>
                )}
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Status</span>
                  <p className="text-sm font-medium mt-0.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedLoan.status === "active" ? "bg-green-50 text-green-700" :
                      selectedLoan.status === "pending" ? "bg-yellow-50 text-yellow-700" :
                      selectedLoan.status === "completed" ? "bg-gray-100 text-gray-600" :
                      "bg-red-50 text-red-700"
                    }`}>
                      {LOAN_STATUS[selectedLoan.status as keyof typeof LOAN_STATUS]}
                    </span>
                  </p>
                </div>
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Pemberi</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedLoan.lender?.displayName || selectedLoan.lender?.email || "-"}</p>
                </div>
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Mulai</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedLoan.startDate ? formatDate(selectedLoan.startDate) : "-"}</p>
                </div>
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Jatuh Tempo</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedLoan.dueDate ? formatDate(selectedLoan.dueDate) : "-"}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLoan(null)}
                className="w-full bg-gray-100 text-gray-700 rounded-xl py-2.5 text-sm font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
