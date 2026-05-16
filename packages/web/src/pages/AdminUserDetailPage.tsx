import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { IconChevronRight, IconCheck, IconXCircle, IconShield, IconStar, IconLoan, IconArrowLeft } from "../components/Icons"
import DocumentViewer from "../components/DocumentViewer"
import { BORROWER_TIER_LABELS, LENDER_TIER_LABELS } from "@amanah/shared"

interface AdminUserDetail {
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
  ratingCount: number
  onTimePercentage: number | null
  completedLoans: number
  createdAt: string
}

interface UserLoan {
  id: string
  borrowerAlias: string
  amount: number
  status: string
  collateralType: string
  createdAt: string
}

interface UserDetailResponse {
  user: AdminUserDetail
  borrowerLoans: UserLoan[]
  lenderLoans: UserLoan[]
}

const roleLabels: Record<string, string> = {
  lender: "Pemberi Pinjaman",
  borrower: "Peminjam",
  trustee: "Wali Amanah",
  admin: "Admin",
}

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  active: "Aktif",
  completed: "Selesai",
  defaulted: "Gagal Bayar",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
}

const collateralLabels: Record<string, string> = {
  document: "Dokumen",
  valuables: "Barang Berharga",
  letter: "Surat",
  none: "Tidak Ada",
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-detail", id],
    queryFn: () => api.get<UserDetailResponse>(`/admin/users/${id}`),
    enabled: !!id,
  })

  const verifyMutation = useMutation({
    mutationFn: ({ isVerified }: { isVerified: boolean }) =>
      api.patch(`/admin/users/${id}`, { isVerified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", id] })
    },
  })

  if (!id) {
    return <div className="text-center py-12 text-gray-500 dark:text-slate-400">ID pengguna tidak ditemukan</div>
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400 dark:text-slate-500">Memuat data pengguna...</div>
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500 dark:text-slate-400">Data pengguna tidak ditemukan</div>
  }

  const { user, borrowerLoans, lenderLoans } = data

  const avgRating = user.rating ? parseFloat(user.rating) : 0
  const onTimeRate = user.onTimePercentage ?? 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
        <Link to="/admin/users" className="hover:text-[var(--color-primary)]">Pengguna</Link>
        <IconChevronRight className="w-4 h-4" />
        <span className="text-gray-900 dark:text-gray-100 font-medium truncate">{user.displayName || user.email}</span>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-2xl font-bold shrink-0">
              {(user.displayName?.[0] || user.email[0] || "A").toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user.displayName || "Tanpa Nama"}</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === "lender" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                  user.role === "borrower" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                  user.role === "trustee" ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" :
                  user.role === "admin" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                  "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                }`}>
                  {roleLabels[user.role || ""] || user.role || "-"}
                </span>
                {user.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    <IconShield className="w-3 h-3" /> Terverifikasi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    <IconXCircle className="w-3 h-3" /> Belum Verifikasi
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!user.isVerified ? (
              <button
                onClick={() => verifyMutation.mutate({ isVerified: true })}
                disabled={verifyMutation.isPending}
                className="bg-[var(--color-primary)] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <IconCheck className="w-4 h-4" /> Verifikasi
              </button>
            ) : (
              <button
                onClick={() => verifyMutation.mutate({ isVerified: false })}
                disabled={verifyMutation.isPending}
                className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <IconXCircle className="w-4 h-4" /> Batalkan Verifikasi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Informasi Profil</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Telepon</span>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{user.phone || "-"}</p>
          </div>
          <div className="py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">NIK</span>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5 font-mono">{user.idNumber || "-"}</p>
          </div>
          <div className="py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Pekerjaan</span>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{user.occupation || "-"}</p>
          </div>
          <div className="py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Profil Lengkap</span>
            <p className="text-sm font-medium mt-0.5">
              {user.profileCompleted ? (
                <span className="text-green-600 dark:text-green-400">Ya</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Belum</span>
              )}
            </p>
          </div>
          <div className="py-2 border-b border-gray-100 dark:border-slate-700 col-span-2">
            <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Alamat</span>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{user.address || "-"}</p>
          </div>
          <div className="py-2 border-b border-gray-100 dark:border-slate-700 col-span-2">
            <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Dokumen KTP</span>
            <p className="text-sm font-medium mt-1">
              {user.ktpDocumentUrl ? (
                <DocumentViewer url={user.ktpDocumentUrl} label="Lihat KTP" variant="image" thumbnail className="w-full h-48 mt-2" />
              ) : (
                <span className="text-gray-400 dark:text-slate-500">Belum upload</span>
              )}
            </p>
          </div>
          <div className="py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Terdaftar Sejak</span>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Rating & Tier */}
      {(user.borrowerTier || user.lenderTier || user.ratingCount > 0) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Rekam Jejak</h2>
          <div className="grid grid-cols-4 gap-4">
            {user.borrowerTier && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <span className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wider">Tier Peminjam</span>
                <p className="text-lg font-bold text-green-700 dark:text-green-400 mt-1">{BORROWER_TIER_LABELS[user.borrowerTier as keyof typeof BORROWER_TIER_LABELS]}</p>
              </div>
            )}
            {user.lenderTier && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <span className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider">Tier Pemberi</span>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400 mt-1">{LENDER_TIER_LABELS[user.lenderTier as keyof typeof LENDER_TIER_LABELS]}</p>
              </div>
            )}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
              <span className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">Rating</span>
              <div className="flex items-center gap-1 mt-1">
                <IconStar className="w-5 h-5 text-amber-500" />
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{avgRating.toFixed(1)}</p>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{user.ratingCount} ulasan</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <span className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider">Tepat Waktu</span>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-400 mt-1">{onTimeRate}%</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">{user.completedLoans} pinjaman selesai</p>
            </div>
          </div>
        </div>
      )}

      {/* Borrower Loans */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Riwayat Pinjaman (sebagai Peminjam)</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{borrowerLoans.length} pinjaman</p>
        </div>
        {borrowerLoans.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 dark:text-slate-500">Belum ada pinjaman sebagai peminjam</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Peminjam</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Jumlah</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Jaminan</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {borrowerLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{loan.borrowerAlias}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-400">{formatCurrency(loan.amount)}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-400">{collateralLabels[loan.collateralType] || loan.collateralType}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      loan.status === "active" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                      loan.status === "completed" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                      loan.status === "defaulted" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                      loan.status === "pending" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                      "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                    }`}>
                      {statusLabels[loan.status] || loan.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{formatDate(loan.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Lender Loans */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Riwayat Pinjaman (sebagai Pemberi)</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{lenderLoans.length} pinjaman</p>
        </div>
        {lenderLoans.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 dark:text-slate-500">Belum ada pinjaman sebagai pemberi</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Peminjam</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Jumlah</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Jaminan</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-slate-400">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {lenderLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{loan.borrowerAlias}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-400">{formatCurrency(loan.amount)}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-slate-400">{collateralLabels[loan.collateralType] || loan.collateralType}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      loan.status === "active" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                      loan.status === "completed" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                      loan.status === "defaulted" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                      loan.status === "pending" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                      "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                    }`}>
                      {statusLabels[loan.status] || loan.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{formatDate(loan.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate("/admin/users")}
        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-[var(--color-primary)]"
      >
        <IconArrowLeft className="w-4 h-4" /> Kembali ke Daftar Pengguna
      </button>
    </div>
  )
}
