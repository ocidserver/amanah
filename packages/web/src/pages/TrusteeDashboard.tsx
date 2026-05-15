import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { IconCheck, IconXCircle, IconShield, IconClock, IconChevronRight, IconUpload } from "../components/Icons"
import { LOAN_PURPOSE, COLLATERAL_TYPE, COLLATERAL_STATUS } from "@amanah/shared"

interface TrusteeProfile {
  id: string
  name: string
  type: string
  email: string | null
  institution: string | null
  isVerified: boolean
}

interface UserInfo {
  isVerified: boolean
  displayName: string | null
  email: string | null
  phone: string | null
  idNumber: string | null
  ktpDocumentUrl: string | null
}

interface LoanInfo {
  id: string
  amount: number
  durationMonths: number
  purpose: string
  collateralType: string
  collateralDescription: string | null
  collateralStatus: string
  status: string
  borrowerAlias: string
}

interface PendingRequest {
  id: string
  loanId: string
  status: string
  createdAt: string
  respondedAt: string | null
  loan: LoanInfo
}

interface HeldCollateral {
  id: string
  loanId: string
  status: string
  loan: LoanInfo
}

interface ProfileResponse {
  trustee: TrusteeProfile
  user: UserInfo
  pendingRequests: PendingRequest[]
  heldCollateral: HeldCollateral[]
}

export default function TrusteeDashboard() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"pending" | "held">("pending")

  const { data, isLoading } = useQuery({
    queryKey: ["trustee-profile"],
    queryFn: () => api.get<ProfileResponse>("/trustee-app/profile"),
  })

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) =>
      api.patch(`/trustee-app/requests/${requestId}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trustee-profile"] })
    },
  })

  const declineMutation = useMutation({
    mutationFn: (requestId: string) =>
      api.patch(`/trustee-app/requests/${requestId}/decline`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trustee-profile"] })
    },
  })

  const verifyCollateralMutation = useMutation({
    mutationFn: ({ loanId, isVerified }: { loanId: string; isVerified: boolean }) =>
      api.patch(`/trustee-app/loans/${loanId}/collateral-verify`, { isVerified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trustee-profile"] })
    },
  })

  const returnCollateralMutation = useMutation({
    mutationFn: (loanId: string) =>
      api.patch(`/trustee-app/loans/${loanId}/collateral-return`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trustee-profile"] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data?.trustee) {
    return (
      <div className="px-4 pt-8 text-center">
        <IconShield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Profil Wali Amanah Tidak Ditemukan</h2>
        <p className="text-sm text-gray-500">Anda belum terdaftar sebagai wali amanah. Hubungi pemberi pinjaman untuk diundang.</p>
      </div>
    )
  }

  const { trustee, user, pendingRequests, heldCollateral } = data

  return (
    <div className="px-4 pt-2 pb-6">
      {/* Profile Header */}
      <div className="bg-[var(--color-primary)] text-white rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <IconShield className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate">{trustee.name}</h1>
            <p className="text-sm opacity-70 truncate">{trustee.institution || "Wali Amanah"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3">
          {user?.isVerified ? (
            <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
              <IconCheck className="w-3 h-3" /> Terverifikasi BMT
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-500/30 px-2 py-1 rounded-full">
              <IconShield className="w-3 h-3" /> Menunggu Verifikasi Admin
            </span>
          )}
          {user?.ktpDocumentUrl && (
            <a href={user.ktpDocumentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full">
              <IconUpload className="w-3 h-3" /> KTP
            </a>
          )}
        </div>
        <div className="flex gap-3 text-sm">
          <div className="bg-white/10 rounded-lg px-3 py-1.5">
            <span className="font-bold">{pendingRequests.length}</span>
            <span className="opacity-70 ml-1">Menunggu</span>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-1.5">
            <span className="font-bold">{heldCollateral.length}</span>
            <span className="opacity-70 ml-1">Jaminan</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "pending"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Permintaan ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("held")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "held"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Jaminan Dipegang ({heldCollateral.length})
        </button>
      </div>

      {/* Pending Requests */}
      {activeTab === "pending" && (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <IconClock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Tidak ada permintaan menunggu</p>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div key={req.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{req.loan.borrowerAlias}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {LOAN_PURPOSE[req.loan.purpose as keyof typeof LOAN_PURPOSE] || req.loan.purpose}
                    </p>
                  </div>
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-medium">Menunggu</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-gray-500 text-xs">Nominal</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(req.loan.amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Durasi</p>
                    <p className="font-semibold text-gray-900">{req.loan.durationMonths} bulan</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Jaminan</p>
                    <p className="font-semibold text-gray-900">{COLLATERAL_TYPE[req.loan.collateralType as keyof typeof COLLATERAL_TYPE] || req.loan.collateralType}</p>
                  </div>
                  {req.loan.collateralDescription && (
                    <div className="col-span-2">
                      <p className="text-gray-500 text-xs">Deskripsi</p>
                      <p className="font-medium text-gray-900 text-sm">{req.loan.collateralDescription}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500 text-xs">Tanggal</p>
                    <p className="font-semibold text-gray-900">{formatDate(req.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (confirm("Terima permintaan ini? Anda akan memegang jaminan peminjam.")) {
                        acceptMutation.mutate(req.id)
                      }
                    }}
                    disabled={acceptMutation.isPending || declineMutation.isPending}
                    className="flex-1 bg-[var(--color-primary)] text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <IconCheck className="w-4 h-4" /> Terima
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Tolak permintaan ini?")) {
                        declineMutation.mutate(req.id)
                      }
                    }}
                    disabled={acceptMutation.isPending || declineMutation.isPending}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <IconXCircle className="w-4 h-4" /> Tolak
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Held Collateral */}
      {activeTab === "held" && (
        <div className="space-y-3">
          {heldCollateral.length === 0 ? (
            <div className="text-center py-12">
              <IconShield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Tidak ada jaminan yang dipegang</p>
            </div>
          ) : (
            heldCollateral.map((held) => {
              const canReturn = held.loan.status === "completed" && (held.loan.collateralStatus === "held" || held.loan.collateralStatus === "verified")
              const isReturned = held.loan.collateralStatus === "returned"
              const isVerified = held.loan.collateralStatus === "verified"

              return (
                <div key={held.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{held.loan.borrowerAlias}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {LOAN_PURPOSE[held.loan.purpose as keyof typeof LOAN_PURPOSE] || held.loan.purpose}
                      </p>
                    </div>
                    {isReturned ? (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">Dikembalikan</span>
                    ) : isVerified ? (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">Terverifikasi</span>
                    ) : held.loan.status === "completed" ? (
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">Siap Dikembalikan</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">Dipegang</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-gray-500 text-xs">Nominal</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(held.loan.amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Jaminan</p>
                      <p className="font-semibold text-gray-900">{COLLATERAL_TYPE[held.loan.collateralType as keyof typeof COLLATERAL_TYPE]}</p>
                    </div>
                    {held.loan.collateralDescription && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs">Deskripsi Jaminan</p>
                        <p className="font-medium text-gray-900 text-sm">{held.loan.collateralDescription}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 text-xs">Status Pinjaman</p>
                      <p className="font-semibold text-gray-900">{COLLATERAL_STATUS[held.loan.collateralStatus as keyof typeof COLLATERAL_STATUS] || held.loan.collateralStatus}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Status Jaminan</p>
                      <p className="font-semibold text-gray-900">{COLLATERAL_STATUS[held.loan.collateralStatus as keyof typeof COLLATERAL_STATUS] || held.loan.collateralStatus}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!isVerified && !isReturned && (
                      <button
                        onClick={() => {
                          if (confirm("Verifikasi jaminan ini? Pastikan dokumen/barang sudah diterima dengan baik.")) {
                            verifyCollateralMutation.mutate({ loanId: held.loanId, isVerified: true })
                          }
                        }}
                        disabled={verifyCollateralMutation.isPending}
                        className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
                      >
                        {verifyCollateralMutation.isPending ? "Memproses..." : "Verifikasi Jaminan"}
                      </button>
                    )}
                    {canReturn && (
                      <button
                        onClick={() => {
                          if (confirm("Kembalikan jaminan ke peminjam? Pastikan pinjaman sudah lunas.")) {
                            returnCollateralMutation.mutate(held.loanId)
                          }
                        }}
                        disabled={returnCollateralMutation.isPending}
                        className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
                      >
                        {returnCollateralMutation.isPending ? "Memproses..." : "Kembalikan Jaminan"}
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
