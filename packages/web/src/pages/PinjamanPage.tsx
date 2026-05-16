import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatCurrency, formatDate } from "../lib/utils"
import { IconPlus, IconLoan, IconClock, IconChevronRight } from "../components/Icons"
import { LOAN_PURPOSE } from "@amanah/shared"
import type { ILoan } from "@amanah/shared"

export default function PinjamanPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["loans"],
    queryFn: () => api.get<{ loans: ILoan[] }>("/loans"),
  })

  const loans = data?.loans ?? []

  if (error) {
    return (
      <div className="px-4 pt-4 pb-4 text-center">
        <p className="text-red-500 text-sm mb-2">Gagal memuat pinjaman</p>
        <button onClick={() => refetch()} className="text-[var(--color-primary)] text-sm font-medium">Coba Lagi</button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Pinjaman</h2>
        <Link
          to="/pinjaman/baru"
          className="inline-flex items-center gap-1 bg-[var(--color-primary)] text-white px-3.5 py-2 rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
        >
          <IconPlus className="w-4 h-4" />
          Baru
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center">
            <IconLoan className="w-6 h-6 text-gray-300 dark:text-slate-500" />
          </div>
          <p className="text-gray-400 dark:text-slate-400">Belum ada pinjaman aktif</p>
          <Link
            to="/pinjaman/baru"
            className="inline-flex items-center gap-1 mt-3 text-[var(--color-primary)] font-medium text-sm"
          >
            <IconPlus className="w-3.5 h-3.5" />
            Catat Pinjaman Baru
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => (
            <Link
              key={loan.id}
              to={`/pinjaman/${loan.id}`}
              className="block bg-white dark:bg-slate-800 dark:border-slate-700 rounded-2xl border border-gray-100 p-4 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{loan.borrowerAlias}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      loan.status === "active" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                      loan.status === "completed" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                      "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                    }`}>
                      {loan.status === "active" ? "Aktif" : loan.status === "completed" ? "Lunas" : loan.status}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(loan.amount)}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500 mt-1">
                    <span>{LOAN_PURPOSE[loan.purpose as keyof typeof LOAN_PURPOSE] || loan.purpose}</span>
                    <span className="flex items-center gap-0.5">
                      <IconClock className="w-3 h-3" />
                      {formatDate(loan.createdAt)}
                    </span>
                  </div>
                </div>
                <IconChevronRight className="w-5 h-5 text-gray-300 dark:text-slate-600 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}