import { useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import { useAuth } from "../hooks/use-auth"
import { LOAN_PURPOSE } from "@amanah/shared"
import { formatCurrency } from "../lib/utils"

export default function InvitationAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => api.get<{
      invitation: { id: string; email: string; expiresAt: string }
      loan: { amount: number; durationMonths: number; purpose: string; borrowerAlias: string }
      lender: { displayName: string | null; email: string } | null
      borrowerExists: boolean
    }>(`/invitations/${token}`),
    enabled: !!token,
  })

  const handleAccept = async () => {
    if (!isAuthenticated) {
      navigate(`/signup?role=borrower&email=${encodeURIComponent(data?.invitation?.email || "")}`)
      return
    }

    if (user?.role !== "borrower") {
      setError("Anda harus mendaftar sebagai peminjam untuk menerima undangan ini.")
      return
    }

    setAccepting(true)
    setError("")
    try {
      await api.post(`/invitations/${token}/accept`, {})
      navigate("/borrower", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menerima undangan")
    } finally {
      setAccepting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data?.invitation) {
    return (
      <div className="min-h-dvh bg-white dark:bg-slate-800 px-4 pt-4 text-center">
        <p className="text-gray-400 dark:text-slate-500 py-8">Undangan tidak ditemukan atau sudah kadaluarsa.</p>
        <Link to="/" className="text-[var(--color-primary)] text-sm font-medium">Kembali ke Beranda</Link>
      </div>
    )
  }

  const { invitation, loan, lender } = data
  const purposeLabel = LOAN_PURPOSE[loan.purpose as keyof typeof LOAN_PURPOSE] || loan.purpose

  return (
    <div className="min-h-dvh bg-white dark:bg-slate-800 px-4 py-8">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center">
            <span className="text-3xl">🤝</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Undangan Pinjaman</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">
            {lender?.displayName || "Pemberi Pinjaman"} mengundang Anda
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-slate-700 rounded-2xl p-5 mb-6">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 dark:text-slate-400">Nominal</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(loan.amount)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-slate-400">Durasi</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{loan.durationMonths} bulan</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-slate-400">Tujuan</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{purposeLabel}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-slate-400">Alias</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{loan.borrowerAlias}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
        )}

        {!isAuthenticated ? (
          <div className="space-y-3">
            <Link
              to={`/signup?role=borrower`}
              state={{ prefillEmail: invitation.email }}
              className="block w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold text-base text-center active:scale-[0.98] transition-transform"
            >
              Daftar sebagai Peminjam
            </Link>
            <Link
              to={`/login`}
              className="block w-full border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-xl py-3 font-semibold text-base text-center active:scale-[0.98] transition-transform"
            >
              Sudah Punya Akun
            </Link>
          </div>
        ) : (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {accepting ? "Menghubungkan..." : "Terima Undangan"}
          </button>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-6">
          Undangan berlaku hingga {new Date(invitation.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </div>
  )
}
