import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatDate } from "../lib/utils"
import { IconCheck, IconXCircle, IconClock, IconEye, IconSearch, IconDownload } from "../components/Icons"
import Pagination from "../components/Pagination"

interface RoleChangeRequest {
  id: string
  userId: string
  requestedRole: string
  status: string
  createdAt: string
  reviewedAt: string | null
  user: {
    id: string
    email: string
    displayName: string | null
    role: string
  }
}

interface RoleChangesResponse {
  requests: RoleChangeRequest[]
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

export default function AdminRoleChangesPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const statusFilter = activeTab === "pending" ? "pending" : "all"

  const { data, isLoading } = useQuery({
    queryKey: ["admin-role-change-requests", statusFilter, search, page, limit],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (search) params.set("search", search)
      params.set("page", String(page))
      params.set("limit", String(limit))
      return api.get<RoleChangesResponse>(`/admin/role-change-requests?${params}`)
    },
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approved" | "rejected" }) =>
      api.patch(`/admin/role-change-requests/${id}/review`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-role-change-requests"] })
      setSelectedIds(new Set())
    },
  })

  const reviewAllMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: "approved" | "rejected" }) =>
      Promise.all(ids.map((id) => api.patch(`/admin/role-change-requests/${id}/review`, { action }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-role-change-requests"] })
      setSelectedIds(new Set())
    },
  })

  const requests = data?.requests || []
  const total = data?.total ?? 0

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === requests.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(requests.map((r) => r.id)))
    }
  }

  const handleBulkAction = (action: "approved" | "rejected") => {
    if (selectedIds.size === 0) return
    const label = action === "approved" ? "setujui" : "tolak"
    if (confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} ${selectedIds.size} permintaan sekaligus?`)) {
      reviewAllMutation.mutate({ ids: Array.from(selectedIds), action })
    }
  }

  const handleExport = () => {
    const dataToExport = activeTab === "history" ? requests : requests.filter((r) => r.status === "pending")
    const blob = new Blob(
      [
        "Pengguna,Email,Role Saat Ini,Role Diminta,Status,Tanggal\n",
        dataToExport
          .map((r) =>
            `"${r.user.displayName || ""}","${r.user.email}","${roleLabels[r.user.role] || r.user.role}","${roleLabels[r.requestedRole] || r.requestedRole}","${r.status === "approved" ? "Disetujui" : r.status === "rejected" ? "Ditolak" : "Menunggu"}","${formatDate(r.createdAt)}"`
          )
          .join("\n"),
      ],
      { type: "text/csv;charset=utf-8;" }
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `perubahan-role-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Perubahan Role</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Tinjau dan setujui permintaan perubahan role</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            aria-label="Ekspor CSV"
          >
            <IconDownload className="w-4 h-4" aria-hidden="true" /> Ekspor
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">{total} permintaan</span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => { setActiveTab("pending"); setPage(1); setSelectedIds(new Set()) }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
              activeTab === "pending"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
            }`}
          >
            Menunggu
          </button>
          <button
            onClick={() => { setActiveTab("history"); setPage(1); setSelectedIds(new Set()) }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
              activeTab === "history"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
            }`}
          >
            Riwayat
          </button>
        </div>
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari nama atau email..."
            aria-label="Cari permintaan"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {activeTab === "pending" && selectedIds.size > 0 && (
        <div className="bg-[var(--color-primary)] text-white rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm font-medium">{selectedIds.size} permintaan dipilih</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction("approved")}
              disabled={reviewAllMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[var(--color-primary)] rounded-lg text-sm font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <IconCheck className="w-4 h-4" aria-hidden="true" /> Setujui Semua
            </button>
            <button
              onClick={() => handleBulkAction("rejected")}
              disabled={reviewAllMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 text-white rounded-lg text-sm font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <IconXCircle className="w-4 h-4" aria-hidden="true" /> Tolak Semua
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 text-white rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Pending */}
      {activeTab === "pending" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16" role="status">
              <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center">
              <IconClock className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" aria-hidden="true" />
              <p className="text-gray-400 dark:text-slate-500 text-sm">Tidak ada permintaan menunggu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400 w-10" scope="col">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === requests.length && requests.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-offset-0"
                        aria-label="Pilih semua"
                      />
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400" scope="col">Pengguna</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400 hidden sm:table-cell" scope="col">Role Saat Ini</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400" scope="col">Role Diminta</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400 hidden md:table-cell" scope="col">Tanggal</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-slate-400" scope="col">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {requests.map((req) => (
                    <tr key={req.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${selectedIds.has(req.id) ? "bg-green-50 dark:bg-green-900/10" : ""}`}>
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(req.id)}
                          onChange={() => toggleSelect(req.id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-offset-0"
                          aria-label={`Pilih ${req.user.displayName || req.user.email}`}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0" aria-hidden="true">
                            {(req.user.displayName?.[0] || req.user.email[0] || "A").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{req.user.displayName || req.user.email}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{req.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300">
                          {roleLabels[req.user.role] || req.user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          {roleLabels[req.requestedRole] || req.requestedRole}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-slate-400 hidden md:table-cell">{formatDate(req.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              if (confirm(`Setujui perubahan role ${req.user.displayName || req.user.email} menjadi ${roleLabels[req.requestedRole]}?`)) {
                                reviewMutation.mutate({ id: req.id, action: "approved" })
                              }
                            }}
                            disabled={reviewMutation.isPending || reviewAllMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-xs font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          >
                            <IconCheck className="w-3.5 h-3.5" aria-hidden="true" /> Setujui
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Tolak permintaan ini?")) {
                                reviewMutation.mutate({ id: req.id, action: "rejected" })
                              }
                            }}
                            disabled={reviewMutation.isPending || reviewAllMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg text-xs font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          >
                            <IconXCircle className="w-3.5 h-3.5" aria-hidden="true" /> Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} limit={limit} total={total} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1) }} />
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16" role="status">
              <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center">
              <IconClock className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" aria-hidden="true" />
              <p className="text-gray-400 dark:text-slate-500 text-sm">Belum ada riwayat</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400" scope="col">Pengguna</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400 hidden sm:table-cell" scope="col">Perubahan</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400" scope="col">Status</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400 hidden md:table-cell" scope="col">Ditinjau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0" aria-hidden="true">
                            {(req.user.displayName?.[0] || req.user.email[0] || "A").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{req.user.displayName || req.user.email}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{req.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="text-gray-600 dark:text-slate-400">{roleLabels[req.user.role]}</span>
                        <span className="mx-2 text-gray-400 dark:text-slate-500">→</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{roleLabels[req.requestedRole]}</span>
                      </td>
                      <td className="px-5 py-3">
                        {req.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                            <IconCheck className="w-3.5 h-3.5" aria-hidden="true" /> Disetujui
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                            <IconXCircle className="w-3.5 h-3.5" aria-hidden="true" /> Ditolak
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-slate-400 hidden md:table-cell">{formatDate(req.reviewedAt || req.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} limit={limit} total={total} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1) }} />
        </div>
      )}
    </div>
  )
}
