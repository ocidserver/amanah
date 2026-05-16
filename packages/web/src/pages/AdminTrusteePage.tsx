import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatDate } from "../lib/utils"
import { IconCheck, IconXCircle, IconShield, IconEye, IconSearch } from "../components/Icons"
import Pagination from "../components/Pagination"

interface AdminTrustee {
  id: string
  name: string
  type: string
  email: string | null
  institution: string | null
  isVerified: boolean
  createdAt: string
  user: {
    id: string
    email: string
    displayName: string | null
    phone: string | null
    idNumber: string | null
    ktpDocumentUrl: string | null
  } | null
}

interface TrusteesResponse {
  trustees: AdminTrustee[]
  total: number
  page: number
  limit: number
}

export default function AdminTrusteePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [verifiedFilter, setVerifiedFilter] = useState("false")
  const [selectedTrustee, setSelectedTrustee] = useState<AdminTrustee | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-trustees", search, verifiedFilter, page, limit],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (verifiedFilter !== "all") params.set("verified", verifiedFilter)
      params.set("page", String(page))
      params.set("limit", String(limit))
      return api.get<TrusteesResponse>(`/admin/trustees?${params}`)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      api.patch(`/admin/trustees/${id}/verify`, { isVerified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trustees"] })
      setSelectedTrustee(null)
    },
  })

  const trustees = data?.trustees || []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Wali Amanah</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Verifikasi dan kelola wali amanah</p>
        </div>
        <span className="text-sm text-gray-500 dark:text-slate-400">{total} wali amanah</span>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Cari nama, institusi, atau email..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setVerifiedFilter("false"); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              verifiedFilter === "false"
                ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"
                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
            }`}
          >
            Belum Verifikasi
          </button>
          <button
            onClick={() => { setVerifiedFilter("true"); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              verifiedFilter === "true"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
            }`}
          >
            Terverifikasi
          </button>
          <button
            onClick={() => { setVerifiedFilter("all"); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              verifiedFilter === "all"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Trustees Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trustees.length === 0 ? (
          <div className="py-16 text-center">
            <IconShield className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-400 dark:text-slate-500">Tidak ada wali amanah ditemukan</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Nama</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Tipe</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Institusi</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Telepon</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">NIK</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">KTP</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Terdaftar</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {trustees.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {(t.name[0] || "W").toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.type === "institution" ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    }`}>
                      {t.type === "institution" ? "Institusi" : "Pribadi"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-400">{t.institution || "-"}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-400">{t.user?.email || t.email || "-"}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-400">{t.user?.phone || "-"}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-400 font-mono text-xs">{t.user?.idNumber || "-"}</td>
                  <td className="px-5 py-3">
                    {t.user?.ktpDocumentUrl ? (
                      <a href={t.user.ktpDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline text-xs">Lihat →</a>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {t.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                        <IconCheck className="w-3.5 h-3.5" /> Terverifikasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                        <IconShield className="w-3.5 h-3.5" /> Menunggu
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{formatDate(t.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setSelectedTrustee(t)}
                      className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:underline font-medium"
                    >
                      <IconEye className="w-4 h-4" /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1) }} />
      </div>

      {/* Trustee Detail Modal */}
      {selectedTrustee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setSelectedTrustee(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xl font-bold shrink-0">
                    {(selectedTrustee.name[0] || "W").toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedTrustee.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{selectedTrustee.type === "institution" ? "Institusi" : "Pribadi"}</p>
                    {selectedTrustee.institution && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{selectedTrustee.institution}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedTrustee(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                  <IconXCircle className="w-6 h-6" />
                </button>
              </div>

              {selectedTrustee.user && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
                  <div className="py-2 border-b border-gray-100 dark:border-slate-700">
                    <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Email</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{selectedTrustee.user.email}</p>
                  </div>
                  <div className="py-2 border-b border-gray-100 dark:border-slate-700">
                    <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Telepon</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{selectedTrustee.user.phone || "-"}</p>
                  </div>
                  <div className="py-2 border-b border-gray-100 dark:border-slate-700">
                    <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">NIK</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5 font-mono">{selectedTrustee.user.idNumber || "-"}</p>
                  </div>
                  <div className="py-2 border-b border-gray-100 dark:border-slate-700">
                    <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Status</span>
                    <p className="text-sm font-medium mt-0.5">
                      {selectedTrustee.isVerified ? (
                        <span className="text-green-600 dark:text-green-400">Terverifikasi</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">Menunggu Verifikasi</span>
                      )}
                    </p>
                  </div>
                  <div className="py-2 border-b border-gray-100 dark:border-slate-700 col-span-2">
                    <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Dokumen KTP</span>
                    <p className="text-sm font-medium mt-0.5">
                      {selectedTrustee.user.ktpDocumentUrl ? (
                        <a href={selectedTrustee.user.ktpDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">Lihat Dokumen KTP →</a>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500">Belum upload</span>
                      )}
                    </p>
                  </div>
                  <div className="py-2 border-b border-gray-100 dark:border-slate-700">
                    <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Terdaftar</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{formatDate(selectedTrustee.createdAt)}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!selectedTrustee.isVerified && (
                  <button
                    onClick={() => verifyMutation.mutate({ id: selectedTrustee.id, isVerified: true })}
                    disabled={verifyMutation.isPending}
                    className="flex-1 bg-[var(--color-primary)] text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <IconCheck className="w-4 h-4" /> Verifikasi
                  </button>
                )}
                {selectedTrustee.isVerified && (
                  <button
                    onClick={() => verifyMutation.mutate({ id: selectedTrustee.id, isVerified: false })}
                    disabled={verifyMutation.isPending}
                    className="flex-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <IconXCircle className="w-4 h-4" /> Batalkan
                  </button>
                )}
                <button
                  onClick={() => setSelectedTrustee(null)}
                  className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl py-2.5 text-sm font-semibold"
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
