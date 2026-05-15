import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import { IconPlus, IconTrustee, IconMail } from "../components/Icons"
import type { ITrustee } from "@amanah/shared"

export default function WaliAmanahPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["trustees"],
    queryFn: () => api.get<{ trustees: ITrustee[] }>("/trustees"),
  })

  const trustees = data?.trustees ?? []

  if (error) {
    return (
      <div className="px-4 pt-4 pb-4 text-center">
        <p className="text-red-500 text-sm mb-2">Gagal memuat wali amanah</p>
        <button onClick={() => refetch()} className="text-[var(--color-primary)] text-sm font-medium">Coba Lagi</button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Wali Amanah</h2>
        <Link
          to="/wali-amanah/undang"
          className="inline-flex items-center gap-1 bg-[var(--color-primary)] text-white px-3.5 py-2 rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
        >
          <IconPlus className="w-4 h-4" />
          Undang
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : trustees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center">
            <IconTrustee className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-400">Belum ada wali amanah</p>
          <Link
            to="/wali-amanah/undang"
            className="inline-flex items-center gap-1 mt-3 text-[var(--color-primary)] font-medium text-sm"
          >
            <IconPlus className="w-3.5 h-3.5" />
            Undang Wali Amanah
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {trustees.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center">
                  <IconTrustee className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                  {t.email && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                      <IconMail className="w-3 h-3" /> {t.email}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {t.type === "personal" ? "Personal" : "Institusi"}
                    </span>
                    {t.is_verified && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Terverifikasi</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}