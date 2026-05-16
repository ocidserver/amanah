import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatDate } from "../lib/utils"
import { IconCheck, IconXCircle, IconEye, IconFileText, IconSearch } from "../components/Icons"
import Pagination from "../components/Pagination"

interface PendingDocument {
  id: string
  email: string
  displayName: string | null
  role: string | null
  phone: string | null
  idNumber: string | null
  ktpDocumentUrl: string | null
  profileCompleted: boolean
  isVerified: boolean
  createdAt: string
}

interface PendingDocsResponse {
  documents: PendingDocument[]
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

export default function AdminDocumentsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [selectedDoc, setSelectedDoc] = useState<PendingDocument | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-documents-pending", search, page, limit],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      params.set("page", String(page))
      params.set("limit", String(limit))
      return api.get<PendingDocsResponse>(`/admin/documents/pending?${params}`)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      api.patch(`/admin/users/${id}`, { isVerified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-documents-pending"] })
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      setSelectedDoc(null)
    },
  })

  const documents = data?.documents || []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Review Dokumen</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Verifikasi KTP pengguna yang baru upload</p>
        </div>
        <span className="text-sm text-gray-500 dark:text-slate-400">{total} dokumen menunggu</span>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari nama atau email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400 dark:text-slate-500">Memuat dokumen...</div>
        ) : documents.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
            <IconFileText className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400 font-medium">Tidak ada dokumen menunggu review</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Semua KTP sudah diverifikasi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {(doc.displayName?.[0] || doc.email[0] || "A").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{doc.displayName || "Tanpa Nama"}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{doc.email}</p>
                    </div>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    doc.role === "lender" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                    doc.role === "borrower" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                    doc.role === "trustee" ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" :
                    "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                  }`}>
                    {roleLabels[doc.role || ""] || doc.role || "-"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">NIK</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">{doc.idNumber || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">Telepon</span>
                    <span className="text-gray-900 dark:text-gray-100">{doc.phone || "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">Upload</span>
                    <span className="text-gray-900 dark:text-gray-100">{formatDate(doc.createdAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-200 dark:hover:bg-slate-600"
                  >
                    <IconEye className="w-4 h-4" /> Lihat
                  </button>
                  {!doc.isVerified && (
                    <button
                      onClick={() => verifyMutation.mutate({ id: doc.id, isVerified: true })}
                      disabled={verifyMutation.isPending}
                      className="flex-1 bg-[var(--color-primary)] text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <IconCheck className="w-4 h-4" /> Verifikasi
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1) }} />
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setSelectedDoc(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Review KTP</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{selectedDoc.displayName || selectedDoc.email}</p>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                  <IconXCircle className="w-6 h-6" />
                </button>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-slate-400">Email</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedDoc.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-400">Role</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{roleLabels[selectedDoc.role || ""] || selectedDoc.role || "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-400">NIK</span>
                    <p className="font-mono font-medium text-gray-900 dark:text-gray-100">{selectedDoc.idNumber || "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-slate-400">Telepon</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedDoc.phone || "-"}</p>
                  </div>
                </div>
              </div>

              {/* KTP Document */}
              {selectedDoc.ktpDocumentUrl ? (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Dokumen KTP:</p>
                  <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-700">
                    <img
                      src={selectedDoc.ktpDocumentUrl}
                      alt="KTP"
                      className="w-full h-auto max-h-[500px] object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none"
                        const parent = (e.target as HTMLImageElement).parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="p-8 text-center text-gray-400">Gagal memuat gambar</div>'
                        }
                      }}
                    />
                  </div>
                  <a
                    href={selectedDoc.ktpDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-sm text-[var(--color-primary)] hover:underline"
                  >
                    Buka di tab baru →
                  </a>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 text-center">
                  <p className="text-amber-700 dark:text-amber-400 font-medium">Dokumen KTP tidak tersedia</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {!selectedDoc.isVerified && (
                  <button
                    onClick={() => verifyMutation.mutate({ id: selectedDoc.id, isVerified: true })}
                    disabled={verifyMutation.isPending}
                    className="flex-1 bg-[var(--color-primary)] text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <IconCheck className="w-4 h-4" /> Verifikasi & Setujui
                  </button>
                )}
                <button
                  onClick={() => setSelectedDoc(null)}
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
