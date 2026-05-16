import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { IconSearch, IconChevronRight, IconEye, IconCalendar, IconDownload } from "../components/Icons"
import { LOAN_STATUS, COLLATERAL_TYPE, LOAN_PURPOSE } from "@amanah/shared"
import Pagination from "../components/Pagination"
import { exportToCSV } from "../lib/export"

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

interface LoansResponse {
  loans: AdminLoan[]
  total: number
  page: number
  limit: number
}

export default function AdminLoansPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-loans", search, statusFilter, dateFrom, dateTo, page, limit],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)
      params.set("page", String(page))
      params.set("limit", String(limit))
      return api.get<LoansResponse>(`/admin/loans?${params}`)
    },
  })

  const loans = data?.loans || []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pinjaman</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Kelola semua pinjaman</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const params = new URLSearchParams()
              if (statusFilter !== "all") params.set("status", statusFilter)
              if (search) params.set("search", search)
              if (dateFrom) params.set("dateFrom", dateFrom)
              if (dateTo) params.set("dateTo", dateTo)
              params.set("page", "1")
              params.set("limit", "1000")
              api.get<LoansResponse>(`/admin/loans?${params}`).then((res) => {
                exportToCSV(
                  res.loans.map((loan) => ({
                    Peminjam: loan.borrowerAlias,
                    Nominal: loan.amount,
                    Durasi_Bulan: loan.durationMonths,
                    Tujuan: LOAN_PURPOSE[loan.purpose as keyof typeof LOAN_PURPOSE] || loan.purpose,
                    Jaminan: COLLATERAL_TYPE[loan.collateralType as keyof typeof COLLATERAL_TYPE] || loan.collateralType,
                    Status: LOAN_STATUS[loan.status as keyof typeof LOAN_STATUS] || loan.status,
                    Pemberi: loan.lender?.displayName || "-",
                    Tanggal: loan.createdAt,
                  })),
                  `pinjaman-${new Date().toISOString().split("T")[0]}`
                )
              })
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <IconDownload className="w-4 h-4" /> Export CSV
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">{total} pinjaman</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Cari peminjam..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
        <div className="flex gap-3">
          <div className="relative">
            <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              placeholder="Dari tanggal"
              className="pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div className="relative">
            <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              placeholder="Sampai tanggal"
              className="pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); setPage(1) }}
              className="px-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-600"
            >
              Reset Tanggal
            </button>
          )}
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 overflow-hidden p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Peminjam</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Nominal</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Durasi</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Jaminan</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Status Jaminan</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Status</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Pemberi</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Tanggal</th>
              <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-gray-400 dark:text-slate-500">Memuat...</td>
              </tr>
            ) : loans.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-gray-400 dark:text-slate-500">Tidak ada pinjaman ditemukan</td>
              </tr>
            ) : (
              loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => navigate(`/admin/loans/${loan.id}`)}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{loan.borrowerAlias}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{LOAN_PURPOSE[loan.purpose as keyof typeof LOAN_PURPOSE] || loan.purpose}</p>
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(loan.amount)}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-400">{loan.durationMonths} bulan</td>
                  <td className="px-5 py-3">
                    {loan.collateralType !== "none" ? (
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{COLLATERAL_TYPE[loan.collateralType as keyof typeof COLLATERAL_TYPE]}</p>
                        {loan.collateralDescription && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-[200px]" title={loan.collateralDescription}>{loan.collateralDescription}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {loan.collateralType !== "none" ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        loan.collateralStatus === "verified" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                        loan.collateralStatus === "held" ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                        loan.collateralStatus === "returned" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                        "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                      }`}>
                        {loan.collateralStatus}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      loan.status === "active" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                      loan.status === "pending" ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                      loan.status === "approved" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                      loan.status === "completed" ? "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400" :
                      loan.status === "defaulted" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                      loan.status === "rejected" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                      "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                    }`}>
                      {LOAN_STATUS[loan.status as keyof typeof LOAN_STATUS] || loan.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-400">{loan.lender?.displayName || "-"}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{formatDate(loan.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/loans/${loan.id}`) }}
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
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1) }} />
      </div>
    </div>
  )
}
