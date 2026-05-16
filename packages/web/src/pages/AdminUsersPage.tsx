import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatDate } from "../lib/utils"
import { exportToCSV } from "../lib/export"
import { IconSearch, IconCheck, IconXCircle, IconShield, IconUser, IconEye, IconDownload } from "../components/Icons"
import { BORROWER_TIER_LABELS, LENDER_TIER_LABELS } from "@amanah/shared"
import Pagination from "../components/Pagination"

interface AdminUser {
  id: string
  email: string
  displayName: string | null
  role: string | null
  phone: string | null
  idNumber: string | null
  address: string | null
  occupation: string | null
  ktpDocumentUrl: string | null
  profileCompleted: boolean
  isVerified: boolean
  borrowerTier: string | null
  lenderTier: string | null
  rating: string | null
  completedLoans: number
  createdAt: string
}

interface UsersResponse {
  users: AdminUser[]
  total: number
  page: number
  limit: number
}

const roleLabels: Record<string, string> = {
  lender: "Pemberi Pinjaman",
  borrower: "Peminjam",
  trustee: "Wali Amanah",
  admin: "Admin",
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, roleFilter, page, limit],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (roleFilter !== "all") params.set("role", roleFilter)
      params.set("page", String(page))
      params.set("limit", String(limit))
      return api.get<UsersResponse>(`/admin/users?${params}`)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      api.patch(`/admin/users/${id}`, { isVerified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    },
  })

  const users = data?.users || []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pengguna</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Kelola semua pengguna terdaftar</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const params = new URLSearchParams()
              if (roleFilter !== "all") params.set("role", roleFilter)
              if (search) params.set("search", search)
              params.set("page", "1")
              params.set("limit", "1000")
              api.get<{ users: AdminUser[] }>(`/admin/users?${params}`).then((res) => {
                exportToCSV(
                  res.users.map((u) => ({
                    Email: u.email,
                    Nama: u.displayName || "-",
                    Role: u.role || "-",
                    Telepon: u.phone || "-",
                    NIK: u.idNumber || "-",
                    Verifikasi: u.isVerified ? "Ya" : "Tidak",
                    Profil: u.profileCompleted ? "Lengkap" : "Belum",
                    Tier_Peminjam: u.borrowerTier || "-",
                    Tier_Pemberi: u.lenderTier || "-",
                    Rating: u.rating || "-",
                    Pinjaman_Selesai: u.completedLoans,
                    Terdaftar: u.createdAt,
                  })),
                  `pengguna-${new Date().toISOString().split("T")[0]}`
                )
              })
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <IconDownload className="w-4 h-4" /> Export CSV
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">{total} pengguna</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Cari nama atau email..."
              aria-label="Cari pengguna"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            aria-label="Filter role"
            className="px-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white dark:bg-slate-700"
          >
            <option value="all">Semua Role</option>
            <option value="lender">Pemberi Pinjaman</option>
            <option value="borrower">Peminjam</option>
            <option value="trustee">Wali Amanah</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 overflow-hidden p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Pengguna</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Role</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Telepon</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">NIK</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Verifikasi</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Profil</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Terdaftar</th>
              <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-gray-400 dark:text-slate-500">Memuat...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-gray-400 dark:text-slate-500">Tidak ada pengguna ditemukan</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => navigate(`/admin/users/${u.id}`)}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {(u.displayName?.[0] || u.email[0] || "A").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{u.displayName || "-"}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.role === "lender" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                      u.role === "borrower" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                      u.role === "trustee" ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" :
                      u.role === "admin" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                      "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                    }`}>
                      {roleLabels[u.role || ""] || u.role || "-"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-400">{u.phone || "-"}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-400 font-mono text-xs">{u.idNumber || "-"}</td>
                  <td className="px-5 py-3">
                    {u.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                        <IconCheck className="w-3.5 h-3.5" /> Ya
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-slate-500">Belum</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {u.profileCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                        <IconCheck className="w-3.5 h-3.5" /> Lengkap
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 dark:text-amber-400">Belum</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${u.id}`) }}
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
