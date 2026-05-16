import { useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim link reset")
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
          <h2 className="text-4xl font-bold mb-4">Lupa Password?</h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Jangan khawatir, Anda bisa mereset password dengan mudah melalui email.
          </p>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reset Password</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Masukkan email untuk menerima link reset</p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl px-4 py-4 mb-4 text-sm">
                <p className="font-semibold mb-1">Email Terkirim!</p>
                <p>Jika email Anda terdaftar, Anda akan menerima link reset password dalam beberapa menit.</p>
              </div>
              <Link to="/login" className="text-[var(--color-primary)] font-semibold text-sm">
                Kembali ke Login
              </Link>
            </div>
          ) : (
            <>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {loading ? "Mengirim..." : "Kirim Link Reset"}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700 text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Ingat password?{" "}
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
