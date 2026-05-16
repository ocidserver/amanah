import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatDate } from "../lib/utils"
import { IconSearch, IconShield } from "../components/Icons"
import Pagination from "../components/Pagination"

interface AuditLogEntry {
  id: string
  adminId: string | null
  action: string
  entityType: string
  entityId: string | null
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  admin: {
    id: string
    email: string
    displayName: string | null
  } | null
}

interface AuditLogsResponse {
  logs: AuditLogEntry[]
  total: number
  page: number
  limit: number
}

const actionLabels: Record<string, string> = {
  update_user: "Ubah Pengguna",
  verify_trustee: "Verifikasi Wali",
  unverify_trustee: "Batalkan Verifikasi Wali",
  approve_role_change: "Setujui Perubahan Role",
  reject_role_change: "Tolak Perubahan Role",
}

const entityLabels: Record<string, string> = {
  user: "Pengguna",
  trustee: "Wali Amanah",
  role_change_request: "Permintaan Role",
  loan: "Pinjaman",
}

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState("")
  const [entityFilter, setEntityFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-logs", entityFilter, page, limit],
    queryFn: () => {
      const params = new URLSearchParams()
      if (entityFilter !== "all") params.set("entityType", entityFilter)
      params.set("page", String(page))
      params.set("limit", String(limit))
      return api.get<AuditLogsResponse>(`/admin/audit-logs?${params}`)
    },
  })

  const logs = data?.logs || []
  const total = data?.total ?? 0

  const filteredLogs = search
    ? logs.filter((log) =>
        log.admin?.email?.toLowerCase().includes(search.toLowerCase()) ||
        log.admin?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        log.details?.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase())
      )
    : logs

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Log Audit</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Riwayat aktivitas admin</p>
        </div>
        <span className="text-sm text-gray-500 dark:text-slate-400">{total} entri</span>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari admin atau detail..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEntityFilter("all"); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              entityFilter === "all" ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
            }`}
          >
            Semua
          </button>
          {Object.entries(entityLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setEntityFilter(key); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                entityFilter === key ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <IconShield className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-400 dark:text-slate-500">Tidak ada log aktivitas</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Admin</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Aksi</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Entitas</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Detail</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">IP</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {(log.admin?.displayName?.[0] || log.admin?.email?.[0] || "A").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{log.admin?.displayName || "Sistem"}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{log.admin?.email || "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-400">
                    {entityLabels[log.entityType] || log.entityType}
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-slate-400 max-w-[200px] truncate" title={log.details || ""}>
                    {log.details || "-"}
                  </td>
                  <td className="px-5 py-3 text-gray-400 dark:text-slate-500 font-mono text-xs">
                    {log.ipAddress || "-"}
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1) }} />
      </div>
    </div>
  )
}
