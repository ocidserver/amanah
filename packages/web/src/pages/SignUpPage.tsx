import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { useI18n } from "../hooks/use-i18n"
import { IconEye, IconEyeOff } from "../components/Icons"

function getPasswordStrength(password: string, t: (key: string, lang: string) => string, lang: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score: 1, label: t("auth.weak", lang), color: "bg-red-500" }
  if (score <= 3) return { score: 2, label: t("auth.medium", lang), color: "bg-amber-500" }
  if (score <= 4) return { score: 3, label: t("auth.strong", lang), color: "bg-green-500" }
  return { score: 4, label: t("auth.veryStrong", lang), color: "bg-[#1B4332]" }
}

function validateEmail(email: string): string {
  if (!email) return ""
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Format email tidak valid"
  return ""
}

function validatePassword(password: string, t: (key: string, lang: string) => string, lang: string): string {
  if (!password) return ""
  if (password.length < 8) return "Password minimal 8 karakter"
  if (password.length > 12) return "Password maksimal 12 karakter"
  if (!/[A-Z]/.test(password)) return "Harus mengandung setidaknya satu huruf besar"
  if (!/[0-9]/.test(password)) return "Harus mengandung setidaknya satu angka"
  if (!/[^A-Za-z0-9]/.test(password)) return "Harus mengandung setidaknya satu simbol"
  return ""
}

function validateRepeatPassword(password: string, repeatPassword: string, t: (key: string, lang: string) => string, lang: string): string {
  if (!repeatPassword) return ""
  if (password !== repeatPassword) return "Password tidak cocok"
  return ""
}

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<{ email: boolean; password: boolean; repeatPassword: boolean }>({ email: false, password: false, repeatPassword: false })
  const { register } = useAuth()
  const { t, language } = useI18n()
  const navigate = useNavigate()

  const emailError = touched.email ? validateEmail(email) : ""
  const passwordError = touched.password ? validatePassword(password, t, language) : ""
  const repeatPasswordError = touched.repeatPassword ? validateRepeatPassword(password, repeatPassword, t, language) : ""
  const strength = getPasswordStrength(password, t, language)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!agreed) {
      setError(t("auth.agreeToTerms"))
      return
    }

    const emailErr = validateEmail(email)
    const pwErr = validatePassword(password, t, language)
    const repeatPwErr = validateRepeatPassword(password, repeatPassword, t, language)
    if (emailErr || pwErr || repeatPwErr) {
      setError(emailErr || pwErr || repeatPwErr)
      return
    }

    setLoading(true)
    try {
      const result = await register(email.trim().toLowerCase(), password, displayName.trim() || undefined) as { emailVerificationRequired?: boolean; email?: string } | undefined
      if (result?.emailVerificationRequired) {
        navigate(`/verify-email?email=${encodeURIComponent(result.email || "")}`, { replace: true })
      } else {
        navigate("/onboarding", { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal")
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
          <h2 className="text-4xl font-bold mb-4">Bergabung dengan<br />Komunitas Amanah</h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Pilih peran Anda setelah mendaftar: sebagai peminjam, pemberi pinjaman, atau wali amanah.
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("auth.signUp")}</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">{t("auth.createAccount")}</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-4 text-sm" role="alert">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("auth.displayName")} <span className="text-gray-400 dark:text-slate-500 font-normal">(opsional)</span></label>
              <input
                id="signup-name"
                type="text"
                placeholder="Nama sesuai KTP"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("auth.email")}</label>
              <input
                id="signup-email"
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
                aria-describedby={emailError ? "signup-email-error" : undefined}
              />
              {emailError && <p id="signup-email-error" className="text-xs text-red-500 dark:text-red-400 mt-1">{emailError}</p>}
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("auth.password")}</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="8-12 karakter, huruf besar, angka, simbol"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (!touched.password) setTouched((p) => ({ ...p, password: true })) }}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  className={`w-full border rounded-xl px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                    passwordError ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-slate-600"
                  } dark:bg-slate-700 dark:text-gray-100`}
                  required
                  minLength={8}
                  maxLength={12}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "signup-password-error" : password ? "signup-password-strength" : undefined}
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
              {passwordError && <p id="signup-password-error" className="text-xs text-red-500 dark:text-red-400 mt-1">{passwordError}</p>}
              {password && !passwordError && (
                <div id="signup-password-strength" className="mt-2" aria-live="polite">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= strength.score ? strength.color : "bg-gray-200 dark:bg-slate-600"
                      }`} />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    strength.score <= 1 ? "text-red-500" :
                    strength.score === 2 ? "text-amber-500" :
                    strength.score === 3 ? "text-green-500" : "text-[#1B4332] dark:text-[#52B788]"
                  }`}>{strength.label}</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="signup-repeat-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("auth.repeatPassword")}</label>
              <div className="relative">
                <input
                  id="signup-repeat-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.confirmPassword")}
                  value={repeatPassword}
                  onChange={(e) => { setRepeatPassword(e.target.value); if (!touched.repeatPassword) setTouched((p) => ({ ...p, repeatPassword: true })) }}
                  onBlur={() => setTouched((p) => ({ ...p, repeatPassword: true }))}
                  className={`w-full border rounded-xl px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${
                    repeatPasswordError ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-slate-600"
                  } dark:bg-slate-700 dark:text-gray-100`}
                  required
                  aria-invalid={!!repeatPasswordError}
                  aria-describedby={repeatPasswordError ? "signup-repeat-password-error" : undefined}
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
              {repeatPasswordError && <p id="signup-repeat-password-error" className="text-xs text-red-500 dark:text-red-400 mt-1">{repeatPasswordError}</p>}
              {repeatPassword && !repeatPasswordError && (
                <p className="text-xs text-green-500 dark:text-green-400 mt-1">Password cocok</p>
              )}
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-offset-0"
              />
              <label htmlFor="agree-terms" className="text-sm text-gray-600 dark:text-slate-400 leading-snug">
                {t("auth.agreeToTerms").replace("Saya ", "")}{" "}
                <Link to="/terms" className="text-[var(--color-primary)] font-medium hover:underline">{t("landing.terms")}</Link>
                {" "}{language === "id" ? "dan" : "and"}{" "}
                <Link to="/privacy" className="text-[var(--color-primary)] font-medium hover:underline">{t("landing.privacy")}</Link>
                {" "}Amanah.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
            >
              {loading ? `${t("auth.signup")}...` : t("auth.signup")}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700 text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link to="/login" className="text-[var(--color-primary)] font-semibold">
                {t("auth.login")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
