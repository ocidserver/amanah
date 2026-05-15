import { useState } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { api } from "../lib/api"

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const token = searchParams.get("token")

  if (!token) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 bg-white">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Tidak Valid</h1>
          <p className="text-gray-500 text-sm mb-4">Link reset password tidak ditemukan. Pastikan Anda mengakses link dari email.</p>
          <Link to="/forgot-password" className="text-[var(--color-primary)] font-semibold text-sm">
            Minta Link Baru
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Password tidak cocok")
      return
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter")
      return
    }

    setLoading(true)
    try {
      await api.post("/auth/reset-password", { token, newPassword: password })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset password")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 bg-white">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Berhasil Diubah</h1>
          <p className="text-gray-500 text-sm mb-6">Silakan login dengan password baru Anda.</p>
          <Link to="/login" className="inline-block bg-[var(--color-primary)] text-white rounded-xl px-8 py-3 font-semibold text-base">
            Masuk
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Buat Password Baru</h1>
          <p className="text-gray-500 mt-1 text-sm">Masukkan password baru untuk akun Anda</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
            <input
              type="password"
              placeholder="Ulangi password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {loading ? "Menyimpan..." : "Simpan Password"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Batal?{" "}
            <Link to="/login" className="text-[var(--color-primary)] font-semibold">
              Kembali ke Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
