import { useState } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import type { UserRole } from "@amanah/shared"

export default function SignUpPage() {
  const [searchParams] = useSearchParams()
  const prefillRole = (searchParams.get("role") as UserRole) || "lender"
  const prefillEmail = searchParams.get("email") || ""
  const [role, setRole] = useState<UserRole>(prefillRole === "borrower" ? "borrower" : "lender")
  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(email.trim().toLowerCase(), password, displayName.trim() || undefined, role)
      navigate(role === "borrower" ? "/borrower" : "/dashboard", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal")
    } finally {
      setLoading(false)
    }
  }

  const isBorrower = role === "borrower"

  return (
    <div className="min-h-dvh flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] text-white flex-col items-center justify-center px-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full border-2 border-white" />
        </div>
        <div className="relative text-center max-w-md">
          <h2 className="text-4xl font-bold mb-4">
            {isBorrower ? "Mulai Perjalanan\nKebaikan Anda" : "Daftarkan Diri\nSebagai Pemberi Pinjaman"}
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            {isBorrower
              ? "Buat akun peminjam dan dapatkan pinjaman tanpa bunga dari pemberi terpercaya."
              : "Catat pinjaman tanpa bunga, jaga privasi peminjam, dan kelola cicilan dengan mudah."}
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Buat Akun</h1>
            <p className="text-gray-500 mt-1 text-sm">Pilih peran dan mulai</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6 bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setRole("lender")}
              className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                !isBorrower ? "bg-white shadow text-[var(--color-primary)]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pemberi Pinjaman
            </button>
            <button
              type="button"
              onClick={() => setRole("borrower")}
              className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isBorrower ? "bg-white shadow text-[var(--color-primary)]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Peminjam
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama <span className="text-gray-400 font-normal">(opsional)</span></label>
              <input
                type="text"
                placeholder={isBorrower ? "Nama lengkap" : "Nama tampilan"}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {loading ? "Mendaftar..." : `Daftar sebagai ${isBorrower ? "Peminjam" : "Pemberi Pinjaman"}`}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-[var(--color-primary)] font-semibold">
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}