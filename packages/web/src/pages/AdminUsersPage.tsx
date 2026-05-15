import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatDate } from "../lib/utils"
import { IconSearch, IconCheck, IconXCircle, IconShield, IconUser, IconEye } from "../components/Icons"
import { BORROWER_TIER_LABELS, LENDER_TIER_LABELS } from "@amanah/shared"

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

const roleLabels: Record<string, string> = {
  lender: "Pemberi Pinjaman",
  borrower: "Peminjam",
  trustee: "Wali Amanah",
  admin: "Admin",
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, roleFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (roleFilter !== "all") params.set("role", roleFilter)
      return api.get<{ users: AdminUser[] }>(`/admin/users?${params}`)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      api.patch(`/admin/users/${id}`, { isVerified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      if (selectedUser) setSelectedUser(null)
    },
  })

  const users = data?.users || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengguna</h1>
          <p className="text-gray-500 mt-1">Kelola semua pengguna terdaftar</p>
        </div>
        <span className="text-sm text-gray-500">{users.length} pengguna</span>
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
              placeholder="Cari nama atau email..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Pengguna</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Telepon</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">NIK</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Verifikasi</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Profil</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Terdaftar</th>
              <th className="text-right px-5 py-3 font-semibold text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-gray-400">Memuat...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-gray-400">Tidak ada pengguna ditemukan</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {(u.displayName?.[0] || u.email[0] || "A").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{u.displayName || "-"}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.role === "lender" ? "bg-blue-50 text-blue-700" :
                      u.role === "borrower" ? "bg-green-50 text-green-700" :
                      u.role === "trustee" ? "bg-purple-50 text-purple-700" :
                      u.role === "admin" ? "bg-red-50 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {roleLabels[u.role || ""] || u.role || "-"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{u.phone || "-"}</td>
                  <td className="px-5 py-3 text-gray-600 font-mono text-xs">{u.idNumber || "-"}</td>
                  <td className="px-5 py-3">
                    {u.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <IconCheck className="w-3.5 h-3.5" /> Ya
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Belum</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {u.profileCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <IconCheck className="w-3.5 h-3.5" /> Lengkap
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600">Belum</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setSelectedUser(u)}
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

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xl font-bold shrink-0">
                    {(selectedUser.displayName?.[0] || selectedUser.email[0] || "A").toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedUser.displayName || "Tanpa Nama"}</h3>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedUser.role === "lender" ? "bg-blue-50 text-blue-700" :
                      selectedUser.role === "borrower" ? "bg-green-50 text-green-700" :
                      selectedUser.role === "trustee" ? "bg-purple-50 text-purple-700" :
                      selectedUser.role === "admin" ? "bg-red-50 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {roleLabels[selectedUser.role || ""] || selectedUser.role || "-"}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                  <IconXCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Telepon</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedUser.phone || "-"}</p>
                </div>
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">NIK</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 font-mono">{selectedUser.idNumber || "-"}</p>
                </div>
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Pekerjaan</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedUser.occupation || "-"}</p>
                </div>
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Verifikasi</span>
                  <p className="text-sm font-medium mt-0.5">
                    {selectedUser.isVerified ? (
                      <span className="text-green-600">Terverifikasi</span>
                    ) : (
                      <span className="text-amber-600">Belum</span>
                    )}
                  </p>
                </div>
                <div className="py-2 border-b border-gray-100 col-span-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Alamat</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedUser.address || "-"}</p>
                </div>
                {selectedUser.borrowerTier && (
                  <div className="py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Tier Peminjam</span>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{BORROWER_TIER_LABELS[selectedUser.borrowerTier as keyof typeof BORROWER_TIER_LABELS]}</p>
                  </div>
                )}
                {selectedUser.lenderTier && (
                  <div className="py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Tier Pemberi</span>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{LENDER_TIER_LABELS[selectedUser.lenderTier as keyof typeof LENDER_TIER_LABELS]}</p>
                  </div>
                )}
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Pinjaman Selesai</span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedUser.completedLoans}</p>
                </div>
                <div className="py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Dokumen KTP</span>
                  <p className="text-sm font-medium mt-0.5">
                    {selectedUser.ktpDocumentUrl ? (
                      <a href={selectedUser.ktpDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">Lihat Dokumen →</a>
                    ) : (
                      <span className="text-gray-400">Belum upload</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {!selectedUser.isVerified && (
                  <button
                    onClick={() => verifyMutation.mutate({ id: selectedUser.id, isVerified: true })}
                    disabled={verifyMutation.isPending}
                    className="flex-1 bg-[var(--color-primary)] text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <IconCheck className="w-4 h-4" /> Verifikasi
                  </button>
                )}
                {selectedUser.isVerified && (
                  <button
                    onClick={() => verifyMutation.mutate({ id: selectedUser.id, isVerified: false })}
                    disabled={verifyMutation.isPending}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <IconXCircle className="w-4 h-4" /> Batalkan Verifikasi
                  </button>
                )}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-sm font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
