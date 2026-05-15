import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatDate } from "../lib/utils"
import { IconCheck, IconXCircle, IconClock, IconEye } from "../components/Icons"

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

const roleLabels: Record<string, string> = {
  lender: "Pemberi Pinjaman",
  borrower: "Peminjam",
  trustee: "Wali Amanah",
  admin: "Admin",
}

export default function AdminRoleChangesPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-role-change-requests"],
    queryFn: () => api.get<{ requests: RoleChangeRequest[] }>("/admin/role-change-requests"),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approved" | "rejected" }) =>
      api.patch(`/admin/role-change-requests/${id}/review`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-role-change-requests"] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const requests = data?.requests || []
  const pendingRequests = requests.filter((r) => r.status === "pending")
  const processedRequests = requests.filter((r) => r.status !== "pending")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perubahan Role</h1>
          <p className="text-gray-500 mt-1">Tinjau dan setujui permintaan perubahan role</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "pending"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Menunggu ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "history"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Riwayat ({processedRequests.length})
        </button>
      </div>

      {/* Pending */}
      {activeTab === "pending" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {pendingRequests.length === 0 ? (
            <div className="py-16 text-center">
              <IconClock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Tidak ada permintaan menunggu</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Pengguna</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Role Saat Ini</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Role Diminta</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Tanggal</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {(req.user.displayName?.[0] || req.user.email[0] || "A").toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{req.user.displayName || req.user.email}</p>
                          <p className="text-xs text-gray-500">{req.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {roleLabels[req.user.role] || req.user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        {roleLabels[req.requestedRole] || req.requestedRole}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(req.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            if (confirm(`Setujui perubahan role ${req.user.displayName || req.user.email} menjadi ${roleLabels[req.requestedRole]}?`)) {
                              reviewMutation.mutate({ id: req.id, action: "approved" })
                            }
                          }}
                          disabled={reviewMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                        >
                          <IconCheck className="w-3.5 h-3.5" /> Setujui
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Tolak permintaan ini?")) {
                              reviewMutation.mutate({ id: req.id, action: "rejected" })
                            }
                          }}
                          disabled={reviewMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold disabled:opacity-50"
                        >
                          <IconXCircle className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {processedRequests.length === 0 ? (
            <div className="py-16 text-center">
              <IconClock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Belum ada riwayat</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Pengguna</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Perubahan</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Ditinjau</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {(req.user.displayName?.[0] || req.user.email[0] || "A").toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{req.user.displayName || req.user.email}</p>
                          <p className="text-xs text-gray-500">{req.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-gray-600">{roleLabels[req.user.role]}</span>
                      <span className="mx-2 text-gray-400">→</span>
                      <span className="font-medium text-gray-900">{roleLabels[req.requestedRole]}</span>
                    </td>
                    <td className="px-5 py-3">
                      {req.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                          <IconCheck className="w-3.5 h-3.5" /> Disetujui
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                          <IconXCircle className="w-3.5 h-3.5" /> Ditolak
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(req.reviewedAt || req.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
