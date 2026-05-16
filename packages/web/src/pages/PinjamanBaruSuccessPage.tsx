import { useLocation, Link } from "react-router-dom"
import { formatCurrency } from "../lib/utils"
import type { ILoan } from "@amanah/shared"

interface LoanSuccessState {
  loan?: ILoan
  invitationSent?: boolean
  borrowerEmail?: string
}

export default function PinjamanBaruSuccessPage() {
  const location = useLocation()
  const state = (location.state as LoanSuccessState) ?? {}
  const loan = state.loan
  const invitationSent = state.invitationSent
  const borrowerEmail = state.borrowerEmail

  return (
    <div className="px-4 pt-4 flex flex-col items-center min-h-[60vh]">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">Pinjaman Berhasil Dibuat</h2>

      {invitationSent && borrowerEmail ? (
        <p className="text-gray-500 dark:text-slate-400 mt-2 text-center max-w-sm">
          Undangan telah dikirim ke <strong>{borrowerEmail}</strong>. Peminjam akan menerima email untuk bergabung.
        </p>
      ) : (
        <p className="text-gray-500 dark:text-slate-400 mt-2 text-center max-w-sm">
          Pinjaman telah dicatat. Anda bisa mengundang peminjam melalui email di halaman detail pinjaman.
        </p>
      )}

      {loan && (
        <div className="mt-6 bg-gray-50 dark:bg-slate-700 rounded-2xl p-5 w-full max-w-sm text-center">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Detail Pinjaman</p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            {loan.borrowerAlias} · {formatCurrency(loan.amount)} · {loan.durationMonths} bulan
          </p>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Link
          to={`/pinjaman/${loan?.id ?? ""}`}
          className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-xl font-medium active:scale-[0.98] transition-transform"
        >
          Lihat Detail
        </Link>
        <Link
          to="/dashboard"
          className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-medium active:scale-[0.98] transition-transform"
        >
          Beranda
        </Link>
      </div>
    </div>
  )
}
