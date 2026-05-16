import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatDate } from "../lib/utils"
import { exportToCSV } from "../lib/export"
import { useI18n } from "../hooks/use-i18n"
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
  const { t, language } = useI18n()
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("admin.users")}</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t("admin.allUsers")}</p>
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
                    Verifikasi: u.isVerified ? t("common.yes") : t("common.no"),
                    Profil: u.profileCompleted ? t("admin.complete") : t("admin.incomplete"),
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
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            aria-label={t("common.export")}
          >
            <IconDownload className="w-4 h-4" aria-hidden="true" /> {t("common.export")} CSV
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">{total} {t("admin.users").toLowerCase()}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder={t("admin.searchUser")}
              aria-label={t("common.search")}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            aria-label={t("common.filter")}
            className="px-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white dark:bg-slate-700"
          >
            <option value="all">{t("admin.allRoles")}</option>
            <option value="lender">{roleLabels.lender}</option>
            <option value="borrower">{roleLabels.borrower}</option>
            <option value="trustee">{roleLabels.trustee}</option>
            <option value="admin">{roleLabels.admin}</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl border border-gray-200 overflow-hidden p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400" scope="col">{t("admin.user")}</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400" scope="col">Role</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400 hidden md:table-cell" scope="col">{t("profile.phone")}</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400 hidden lg:table-cell" scope="col">{t("profile.idNumber")}</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400" scope="col">{t("admin.verification")}</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400 hidden sm:table-cell" scope="col">{t("admin.profile")}</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400 hidden lg:table-cell" scope="col">{t("admin.registered")}</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-slate-400" scope="col">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400 dark:text-slate-500" role="status">{t("common.loading")}</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400 dark:text-slate-500">{t("common.notFound")}</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer focus-within:bg-gray-50 dark:focus-within:bg-slate-700/50" onClick={() => navigate(`/admin/users/${u.id}`)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0" aria-hidden="true">
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
                    <td className="px-5 py-3 text-gray-600 dark:text-slate-400 hidden md:table-cell">{u.phone || "-"}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-slate-400 font-mono text-xs hidden lg:table-cell">{u.idNumber || "-"}</td>
                    <td className="px-5 py-3">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                          <IconCheck className="w-3.5 h-3.5" aria-hidden="true" /> {t("common.yes")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                          <IconXCircle className="w-3.5 h-3.5" aria-hidden="true" /> {t("common.no")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      {u.profileCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                          <IconCheck className="w-3.5 h-3.5" aria-hidden="true" /> {t("admin.complete")}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600 dark:text-amber-400">{t("admin.incomplete")}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-slate-400 hidden lg:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${u.id}`) }}
                        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:underline font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded px-1"
                        aria-label={`${t("common.view")} ${u.displayName || u.email}`}
                      >
                        <IconEye className="w-4 h-4" aria-hidden="true" /> {t("admin.viewDetail")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1) }} />
      </div>
    </div>
  )
}
