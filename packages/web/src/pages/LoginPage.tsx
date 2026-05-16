import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { useAuthStore } from "../stores/auth-store"
import { useI18n } from "../hooks/use-i18n"
import { IconEye, IconEyeOff, IconShield } from "../components/Icons"

function validateEmail(email: string): string {
  if (!email) return ""
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Format email tidak valid"
  return ""
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<{ email: boolean }>({ email: false })
  const { login, verify2fa } = useAuth()
  const { t, language } = useI18n()
  const navigate = useNavigate()

  const [show2fa, setShow2fa] = useState(false)
  const [totpCode, setTotpCode] = useState("")
  const [userId, setUserId] = useState("")

  const emailError = touched.email ? validateEmail(email) : ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
      const state = useAuthStore.getState()
      if (!state.isAuthenticated && state.user?.role === "admin") {
        setUserId(state.user.id)
        setShow2fa(true)
        return
      }
      const user = state.user
      if (user?.role === "admin") navigate("/admin", { replace: true })
      else if (user?.role === "borrower") navigate("/borrower", { replace: true })
      else if (user?.role === "trustee") navigate("/trustee", { replace: true })
      else navigate("/dashboard", { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login gagal"
      if (message.includes("Email belum diverifikasi")) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true })
        return
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await verify2fa(userId, totpCode)
      navigate("/admin", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kode 2FA tidak valid")
    } finally {
      setLoading(false)
    }
  }

  if (show2fa) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8">
          <div className="flex items-center gap-3 mb-6">
            <IconShield className="w-8 h-8 text-[var(--color-primary)]" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Verifikasi 2FA</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Masukkan 6-digit kode dari authenticator</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-4 text-sm" role="alert">{error}</div>
          )}

          <form onSubmit={handle2faSubmit} className="space-y-4">
            <div>
              <label htmlFor="totp-code" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Kode 2FA</label>
              <input
                id="totp-code"
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="000000"
                autoFocus
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
            >
              {loading ? "Memverifikasi..." : "Verifikasi"}
            </button>
          </form>

          <button
            onClick={() => { setShow2fa(false); setTotpCode("") }}
            className="w-full mt-4 text-gray-500 dark:text-slate-400 text-sm font-medium hover:text-gray-700 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded py-2"
          >
            Kembali
          </button>
        </div>
      </div>
    )
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("auth.login")}</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">{t("auth.welcomeBack")}</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-4 text-sm" role="alert">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("auth.email")}</label>
              <input
                id="login-email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (!touched.email) setTouched((p) => ({ ...p, email: true })) }}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                className={`w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                  emailError ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-slate-600"
                } dark:bg-slate-700 dark:text-gray-100`}
                required
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "login-email-error" : undefined}
              />
              {emailError && <p id="login-email-error" className="text-xs text-red-500 dark:text-red-400 mt-1">{emailError}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t("auth.password")}</label>
                <Link to="/forgot-password" className="text-xs text-[var(--color-primary)] font-medium">{t("auth.forgotPassword")}</Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.enterPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded p-0.5"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
            >
              {loading ? `${t("auth.login")}...` : t("auth.login")}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700 text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {t("auth.noAccount")}{" "}
              <Link to="/signup" className="text-[var(--color-primary)] font-semibold">
                {t("auth.signup")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
