import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { useAuthStore } from "../stores/auth-store"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
      const user = useAuthStore.getState().user
      if (user?.role === "admin") navigate("/admin", { replace: true })
      else if (user?.role === "borrower") navigate("/borrower", { replace: true })
      else if (user?.role === "trustee") navigate("/trustee", { replace: true })
      else navigate("/dashboard", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] text-white flex-col items-center justify-center px-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full border-2 border-white" />
        </div>
        <div className="relative text-center max-w-md">
          <h2 className="text-4xl font-bold mb-4">Pinjaman Kebajikan,<br />Tanpa Riba.</h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Amanah membantu Anda mencatat Qardhul Hasan dengan transparansi dan menjaga privasi peminjam.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">0%</p>
              <p className="text-white/60 text-sm mt-1">Bunga</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">100%</p>
              <p className="text-white/60 text-sm mt-1">Privasi</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">∞</p>
              <p className="text-white/60 text-sm mt-1">Kebaikan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-slate-800">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Masuk</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Selamat datang kembali di Amanah</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-[var(--color-primary)] font-medium">Lupa password?</Link>
              </div>
              <input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {loading ? "Masuk..." : "Masuk"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700 text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Belum punya akun?{" "}
              <Link to="/signup" className="text-[var(--color-primary)] font-semibold">
                Daftar
              </Link>
            </p>
          </div>

<div className="mt-4 text-center">
              <p className="text-xs text-gray-400 dark:text-slate-500">Belum punya akun? <Link to="/signup" className="text-[var(--color-primary)] font-medium">Daftar sekarang</Link></p>
            </div>
        </div>
      </div>
    </div>
  )
}
