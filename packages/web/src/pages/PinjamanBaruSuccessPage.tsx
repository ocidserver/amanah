import { useLocation, Link } from "react-router-dom"
import type { ILoan } from "@amanah/shared"

interface LoanSuccessState {
  loan?: ILoan
}

export default function PinjamanBaruSuccessPage() {
  const location = useLocation()
  const loan = (location.state as LoanSuccessState)?.loan

  return (
    <div className="px-4 pt-4 flex flex-col items-center min-h-[60vh]">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-gray-900 text-center">Pinjaman Berhasil Dibuat</h2>
      <p className="text-gray-500 mt-2 text-center max-w-sm">
        Pinjaman telah dicatat. Peminjam akan menerima undangan melalui email.
      </p>

      {loan && (
        <div className="mt-6 bg-gray-50 rounded-2xl p-5 w-full max-w-sm text-center">
          <p className="text-xs text-gray-500 mb-1">Detail Pinjaman</p>
          <p className="text-sm text-gray-500 mt-2">
            {loan.borrower_alias} · {loan.amount.toLocaleString("id-ID")} Rp · {loan.duration_months} bulan
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
          className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-medium active:scale-[0.98] transition-transform"
        >
          Beranda
        </Link>
      </div>
    </div>
  )
}