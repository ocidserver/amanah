import { Link } from "react-router-dom"
import { IconHome } from "../components/Icons"

export default function NotFoundPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-8">
        <h1 className="text-8xl font-bold text-[var(--color-primary)]">404</h1>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Halaman Tidak Ditemukan</h2>
      <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-sm">
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
      >
        <IconHome className="w-5 h-5" />
        Kembali ke Beranda
      </Link>
    </div>
  )
}
